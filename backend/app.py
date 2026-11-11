from flask import Flask, request, jsonify
from dotenv import load_dotenv
import essentia.standard as es
import hmac
import tempfile
import os
import time
import logging
import magic
import psutil
import redis
import re
import json
from werkzeug.utils import secure_filename
from functools import wraps
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 150 * 1024 * 1024  # 150MB
MAX_REQUEST_SIZE = 200 * 1024 * 1024  # 200MB, matches nginx client_max_body_size
MIN_FILE_SIZE = 1024  # 1KB
MIN_AUDIO_DURATION = 176400  # 4 seconds at 44.1kHz
MAX_PER_MINUTE = 10
MAX_PER_HOUR = 100
MAX_MEMORY_USAGE = 80  # Percentage
MAX_CPU_USAGE = 90   # Percentage
MAX_ADMIN_FAILURES = 5
ADMIN_LOCKOUT_SECONDS = 900

app.config['MAX_CONTENT_LENGTH'] = MAX_REQUEST_SIZE

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# Redis connection
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    logger.info("Redis connected successfully")
except redis.ConnectionError:
    logger.error("Redis connection failed. Rate limiting disabled.")
    redis_client = None

AUDIO_SIGNATURES = {
    b'\xFF\xFB': 'audio/mpeg',  # MP3
    b'\xFF\xF3': 'audio/mpeg',  # MP3
    b'\xFF\xF2': 'audio/mpeg',  # MP3
    b'RIFF': 'audio/wav',       # WAV
    b'fLaC': 'audio/flac',      # FLAC
    b'OggS': 'audio/ogg',       # OGG
    b'\x00\x00\x00 ftypM4A': 'audio/mp4',  # M4A
    b'ID3': 'audio/mpeg',       # MP3 with ID3
}

def error_response(code, message, status=400):
    return jsonify({'error_code': code, 'error': message}), status

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        challenge = ('', 401, {'WWW-Authenticate': 'Basic realm="Admin"'})
        auth = request.authorization
        if not auth:
            return challenge

        client_ip = get_client_ip()
        fail_key = f"admin_failures:{client_ip}"
        if redis_client:
            try:
                if int(redis_client.get(fail_key) or 0) >= MAX_ADMIN_FAILURES:
                    return error_response('RATE_LIMITED', 'Too many failed attempts. Try again later.', 429)
            except redis.RedisError as e:
                logger.error(f"Admin lockout check failed: {e}")

        username_ok = hmac.compare_digest((auth.username or '').encode(), (ADMIN_USERNAME or '').encode())
        password_ok = hmac.compare_digest((auth.password or '').encode(), (ADMIN_PASSWORD or '').encode())
        if not (ADMIN_USERNAME and ADMIN_PASSWORD and username_ok and password_ok):
            logger.warning(f"Failed admin login from {client_ip}")
            if redis_client:
                try:
                    pipe = redis_client.pipeline()
                    pipe.incr(fail_key)
                    pipe.expire(fail_key, ADMIN_LOCKOUT_SECONDS)
                    pipe.execute()
                except redis.RedisError as e:
                    logger.error(f"Admin failure tracking failed: {e}")
            return challenge
        return f(*args, **kwargs)
    return decorated

def track_analytics(event_type, error_message=None, **kwargs):
    """Track analytics in Redis"""
    if not redis_client:
        return
    
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        hour = datetime.now().strftime('%Y-%m-%d-%H')
        
        redis_client.incr(f"analytics:total:{event_type}")
        redis_client.incr(f"analytics:daily:{today}:{event_type}")
        redis_client.incr(f"analytics:hourly:{hour}:{event_type}")
        
        # Track specific metrics
        for key, value in kwargs.items():
            if value:
                safe_value = re.sub(r'[^a-zA-Z0-9_-]', '_', str(value))
                redis_client.incr(f"analytics:{event_type}:{key}:{safe_value}")
        
        # Store individual error details
        if event_type == 'errors' and error_message:
            timestamp = int(time.time() * 1000)
            error_id = f"analytics:errors:recent:{timestamp}"
            error_data = {
                "type": kwargs.get('error_type', 'unknown'),
                "message": error_message,
                "ip": get_client_ip(),
                "timestamp": datetime.now().isoformat(),
                "user_agent": request.headers.get('User-Agent', 'Unknown')[:200]
            }
            redis_client.setex(error_id, 604800, json.dumps(error_data))
        
        # Set expiration for hourly keys (30 days)
        redis_client.expire(f"analytics:hourly:{hour}:{event_type}", 30 * 24 * 3600)
        
    except Exception as e:
        logger.error(f"Analytics tracking failed: {e}")

def get_client_ip():
    # Only nginx can reach this app, and it sets X-Real-IP from the socket address.
    # X-Forwarded-For is client controlled, so it is deliberately ignored.
    return request.headers.get('X-Real-IP') or request.remote_addr

def rate_limit_check(ip_address):
    if not redis_client:
        return True, "OK"
    
    try:
        # Minute limit
        minute_key = f"rate_limit:minute:{ip_address}"
        count_minute = redis_client.get(minute_key)
        if count_minute is None:
            redis_client.setex(minute_key, 60, 1)
        else:
            if int(count_minute) >= MAX_PER_MINUTE:
                ttl = redis_client.ttl(minute_key)
                track_analytics('rate_limited')
                return False, f"Rate limit exceeded. Try again in {max(ttl, 1)} seconds."
            redis_client.incr(minute_key)

        # Hour limit
        hour_key = f"rate_limit:hour:{ip_address}"
        count_hour = redis_client.get(hour_key)
        if count_hour is None:
            redis_client.setex(hour_key, 3600, 1)
        else:
            if int(count_hour) >= MAX_PER_HOUR:
                ttl = redis_client.ttl(hour_key)
                minutes = max(int(ttl / 60), 1)
                track_analytics('rate_limited')
                return False, f"Hourly rate limit exceeded. Try again in {minutes} minutes."
            redis_client.incr(hour_key)

        return True, "OK"

    except Exception as e:
        logger.error(f"Redis rate limiting error: {e}")
        return True, "OK"

def check_system_resources():
    try:
        memory_usage = psutil.virtual_memory().percent
        cpu_usage = psutil.cpu_percent(interval=0.1)
        
        if memory_usage > MAX_MEMORY_USAGE:
            return False, f"System memory usage too high: {memory_usage}%"
        
        if cpu_usage > MAX_CPU_USAGE:
            return False, f"System CPU usage too high: {cpu_usage}%"
            
        return True, "OK"
    except Exception as e:
        logger.warning(f"Could not check system resources: {e}")
        return True, "OK"

def validate_audio_file(file_data, filename):
    secure_name = secure_filename(filename)
    if not secure_name:
        return False, "Invalid filename"
    
    if len(file_data) < MIN_FILE_SIZE:
        return False, "File too small to be valid audio"
    
    if len(file_data) > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
    
    file_header = file_data[:20]
    is_valid_audio = False
    
    for signature in AUDIO_SIGNATURES:
        if file_header.startswith(signature):
            is_valid_audio = True
            break
        if b'M4A' in file_header and b'ftyp' in file_header:
            is_valid_audio = True
            break
    
    if not is_valid_audio:
        try:
            detected_mime = magic.from_buffer(file_data, mime=True)
            if detected_mime and detected_mime.startswith('audio/'):
                is_valid_audio = True
        except Exception as e:
            logger.warning(f"Magic detection failed: {e}")
    
    if not is_valid_audio:
        return False, "File does not appear to be a valid audio format"
    
    if not filename or len(filename.strip()) == 0:
        return False, "Invalid filename"
    
    suspicious_extensions = ['.exe', '.bat', '.scr', '.com', '.pif', '.js', '.vbs', '.jar', '.php', '.asp']
    filename_lower = filename.lower()
    for ext in suspicious_extensions:
        if filename_lower.endswith(ext):
            return False, "Suspicious file extension detected"
    
    if '..' in filename or '/' in filename or '\\' in filename:
        return False, "Invalid characters in filename"
    
    return True, "Valid audio file"

@app.route('/api/analyze', methods=['POST'])
def analyze_bpm():
    start_time = time.time()
    client_ip = get_client_ip()
    logger.info(f"BPM analysis request from {client_ip}")
    
    temp_path = None
    
    try:
        track_analytics('requests')
        
        rate_ok, rate_msg = rate_limit_check(client_ip)
        if not rate_ok:
            logger.warning(f"Rate limit exceeded for IP {client_ip}: {rate_msg}")
            track_analytics('errors', error_message=rate_msg, error_type='rate_limited')
            return error_response('RATE_LIMITED', rate_msg, 429)
        
        resource_ok, resource_msg = check_system_resources()
        if not resource_ok:
            logger.warning(f"Resource limit hit: {resource_msg}")
            track_analytics('errors', error_message=resource_msg, error_type='resource_limit')
            return error_response('SERVICE_OVERLOADED', 'Service temporarily overloaded. Please try again in a few minutes.', 503)
        
        if 'audio' not in request.files:
            track_analytics('errors', error_message='No audio file provided', error_type='no_file')
            return error_response('NO_FILE', 'No audio file provided')
        
        file = request.files['audio']
        if not file or not file.filename:
            track_analytics('errors', error_message='Empty file or missing filename', error_type='empty_file')
            return error_response('EMPTY_FILE', 'Empty file or missing filename')
        
        file.seek(0)
        file_data = file.read()
        file.seek(0)
        
        file_size = len(file_data)
        logger.info(f"Processing file: {file.filename} ({file_size / (1024*1024):.1f}MB) from IP {client_ip}")
        
        file_ext = os.path.splitext(file.filename)[1].lower().replace('.', '') or 'unknown'
        track_analytics('file_formats', format=file_ext)
        
        is_valid, validation_msg = validate_audio_file(file_data, file.filename)
        if not is_valid:
            logger.warning(f"File validation failed: {validation_msg}")
            track_analytics('errors', error_message=validation_msg, error_type='invalid_file')
            return error_response('INVALID_FILE', validation_msg)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
            file.save(tmp.name)
        
        try:
            loader = es.MonoLoader(filename=temp_path)
            audio = loader()
        except Exception as e:
            logger.error(f"Failed to load audio file: {str(e)}")
            track_analytics('errors', error_message=f'Failed to load: {str(e)}', error_type='corrupt_file')
            return error_response('CORRUPT_FILE', 'Audio file is corrupted or unsupported')
        
        if len(audio) == 0:
            track_analytics('errors', error_message='Audio file contains no audio data', error_type='empty_audio')
            return error_response('EMPTY_AUDIO', 'Audio file contains no audio data')
        
        if len(audio) < MIN_AUDIO_DURATION:
            track_analytics('errors', error_message='Audio file too short', error_type='too_short')
            return error_response('TOO_SHORT', 'Audio file too short for BPM analysis (minimum 4 seconds)')
        
        max_samples = 60 * 44100
        if len(audio) > max_samples:
            audio = audio[:max_samples]
            logger.info("Audio trimmed to 60 seconds for analysis")
        
        try:
            rhythm_extractor = es.RhythmExtractor2013(method="degara")
            bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)
        except Exception as e:
            logger.error(f"BPM analysis failed: {str(e)}")
            track_analytics('errors', error_message=f'BPM analysis failed: {str(e)}', error_type='analysis_failed')
            return error_response('ANALYSIS_FAILED', 'BPM analysis failed. Audio may have irregular rhythm or be too quiet', 500)
        
        if not bpm or bpm <= 0 or bpm > 300:
            logger.warning(f"Invalid BPM detected: {bpm}")
            track_analytics('errors', error_message=f'Invalid BPM detected: {bpm}', error_type='invalid_bpm')
            return error_response('INVALID_BPM', 'Could not detect valid BPM. Audio may have irregular rhythm or be too quiet', 422)
        
        bpm_result = round(float(bpm), 1)
        
        bpm_range = f"{int(bpm_result // 20) * 20}-{int(bpm_result // 20) * 20 + 19}"
        track_analytics('bpm_ranges', range=bpm_range)
        
        # Key Detection
        key_result = None
        key_confidence = 0.0
        try:
            key_extractor = es.KeyExtractor()
            key, scale, strength = key_extractor(audio)
            key_confidence = float(strength)
            
            if key_confidence > 0.3:
                key_result = f"{key} {scale}"
                logger.info(f"Key detected: {key_result} (confidence: {key_confidence:.2f})")
                track_analytics('key_detection', success='true', key=key, scale=scale)
            else:
                logger.info(f"Key detection low confidence: {key} {scale} (confidence: {key_confidence:.2f})")
                track_analytics('key_detection', success='false')
        except Exception as e:
            logger.error(f"Key detection failed: {str(e)}")
            track_analytics('key_detection', success='false')
        
        total_time = time.time() - start_time
        logger.info(f"Analysis complete: {bpm_result} BPM in {total_time:.2f}s for IP {client_ip}")
        
        time_range = f"{int(total_time)}s" if total_time < 10 else "10s+"
        track_analytics('processing_times', range=time_range)
        track_analytics('successes')
        
        response_data = {
            'bpm': bpm_result,
            'confidence': float(beats_confidence) if beats_confidence else 0.0,
            'processing_time': round(total_time, 2),
            'file_size': file_size,
            'audio_duration': len(audio) / 44100
        }
        
        if key_result:
            response_data['key'] = key_result
            response_data['key_confidence'] = round(key_confidence, 2)
        
        return jsonify(response_data)
        
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Unexpected error during BPM analysis after {total_time:.2f}s: {str(e)}")
        track_analytics('errors', error_message=str(e), error_type='server_error')
        return error_response('SERVER_ERROR', 'Internal server error during audio processing', 500)
        
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")

@app.route('/api/admin', methods=['GET'])
@require_auth
def admin_dashboard():
    if not redis_client:
        return jsonify({'error': 'Analytics not available - Redis not connected'}), 503
    
    try:
        total_requests = int(redis_client.get('analytics:total:requests') or 0)
        total_successes = int(redis_client.get('analytics:total:successes') or 0)
        total_errors = int(redis_client.get('analytics:total:errors') or 0)
        
        success_rate = round((total_successes / total_requests * 100) if total_requests > 0 else 0, 1)
        error_rate = round((total_errors / total_requests * 100) if total_requests > 0 else 0, 1)
        
        # Get recent daily stats (last 7 days)
        daily_stats = []
        for i in range(7):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            requests = int(redis_client.get(f'analytics:daily:{date}:requests') or 0)
            successes = int(redis_client.get(f'analytics:daily:{date}:successes') or 0)
            errors = int(redis_client.get(f'analytics:daily:{date}:errors') or 0)
            daily_stats.append({
                'date': date,
                'requests': requests,
                'successes': successes,
                'errors': errors
            })
        
        recent_errors = []
        error_log_keys = list(redis_client.scan_iter(match='analytics:errors:recent:*', count=100))
        for key in sorted(error_log_keys, reverse=True)[:20]:
            error_data = redis_client.get(key)
            if error_data:
                try:
                    err = json.loads(error_data)
                    recent_errors.append({
                        "type": err.get("type", "unknown"),
                        "message": err.get("message", ""),
                        "ip": err.get("ip", "N/A"),
                        "timestamp": err.get("timestamp", ""),
                        "user_agent": err.get("user_agent", "")
                    })
                except json.JSONDecodeError:
                    pass
        
        return jsonify({
            'summary': {
                'total_requests': total_requests,
                'total_successes': total_successes,
                'total_errors': total_errors,
                'success_rate': success_rate,
                'error_rate': error_rate
            },
            'daily_stats': list(reversed(daily_stats)),
            'errors': {
                'recent_errors': recent_errors
            }
        })
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        return jsonify({'error': 'Failed to fetch analytics data'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        if psutil.virtual_memory().percent > 95 or psutil.cpu_percent(interval=0.1) > 95:
            return jsonify({'status': 'unhealthy'}), 503
        return jsonify({'status': 'healthy'})
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'unhealthy'}), 503

@app.errorhandler(413)
def request_entity_too_large(error):
    track_analytics('errors', error_message='File too large', error_type='file_too_large')
    return error_response('FILE_TOO_LARGE', f'File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024*1024)}MB.', 413)

@app.errorhandler(429)
def ratelimit_handler(error):
    return error_response('RATE_LIMITED', 'Too many requests. Please wait before trying again.', 429)

if __name__ == '__main__':
    logger.info("Starting BPM Analyzer backend with analytics")
    app.run(debug=False, host='127.0.0.1', port=8001)