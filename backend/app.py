from flask import Flask, request, jsonify
from flask_cors import CORS
import essentia
import essentia.standard as es
import tempfile
import os
import time
import logging
import magic
import sqlite3
from functools import wraps
from datetime import datetime, timedelta
import psutil
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database path
DB_PATH = 'db/rate_limits.db'

# Configuration
MAX_FILE_SIZE = 150 * 1024 * 1024  # 150MB
MIN_FILE_SIZE = 1024  # 1KB
MAX_REQUESTS_PER_HOUR = 100
MAX_REQUESTS_PER_MINUTE = 2  
MAX_FAILED_ATTEMPTS = 10     
BLOCK_DURATION = 3600  # 1 hour in seconds
MAX_MEMORY_USAGE = 80  # Percentage
MAX_CPU_USAGE = 90   # Percentage

# Supported audio formats
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

def get_client_ip():
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    return request.remote_addr

def check_system_resources():
    try:
        memory_usage = psutil.virtual_memory().percent
        cpu_usage = psutil.cpu_percent(interval=1)
        
        if memory_usage > MAX_MEMORY_USAGE:
            return False, f"System memory usage too high: {memory_usage}%"
        
        if cpu_usage > MAX_CPU_USAGE:
            return False, f"System CPU usage too high: {cpu_usage}%"
            
        return True, "OK"
    except Exception as e:
        logger.warning(f"Could not check system resources: {e}")
        return True, "OK"

def cleanup_old_records():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        hour_ago = time.time() - 3600
        cursor.execute('DELETE FROM rate_limits WHERE timestamp < ?', (hour_ago,))
        
        now = time.time()
        cursor.execute('DELETE FROM failed_attempts WHERE blocked_until > 0 AND blocked_until < ?', (now,))
        
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"Failed to cleanup old records: {e}")

def rate_limit_check(ip_address):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        now = time.time()
        hour_ago = now - 3600
        minute_ago = now - 60
        
        cleanup_old_records()
        
        # Check if IP is blocked
        cursor.execute('SELECT blocked_until FROM failed_attempts WHERE ip_address = ? AND blocked_until > ?', 
                      (ip_address, now))
        blocked_result = cursor.fetchone()
        if blocked_result:
            conn.close()
            return False, "IP temporarily blocked due to too many failed attempts"
        
        # Count requests in the last minute
        cursor.execute('SELECT COUNT(*) FROM rate_limits WHERE ip_address = ? AND timestamp > ?', 
                      (ip_address, minute_ago))
        minute_count = cursor.fetchone()[0]
        
        if minute_count >= MAX_REQUESTS_PER_MINUTE:
            conn.close()
            return False, f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_MINUTE} requests per minute"
        
        # Count requests in the last hour
        cursor.execute('SELECT COUNT(*) FROM rate_limits WHERE ip_address = ? AND timestamp > ?', 
                      (ip_address, hour_ago))
        hour_count = cursor.fetchone()[0]
        
        if hour_count >= MAX_REQUESTS_PER_HOUR:
            conn.close()
            return False, f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_HOUR} requests per hour"
        
        conn.close()
        return True, "OK"
        
    except Exception as e:
        logger.error(f"Rate limit check failed: {e}")
        return True, "OK"  # Don't block on database errors

def record_request(ip_address, success=True):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        now = time.time()
        
        # Record the request
        cursor.execute('INSERT INTO rate_limits (ip_address, timestamp, success) VALUES (?, ?, ?)', 
                      (ip_address, now, 1 if success else 0))
        
        if not success:
            # Update failed attempts
            cursor.execute('SELECT count FROM failed_attempts WHERE ip_address = ?', (ip_address,))
            result = cursor.fetchone()
            
            if result:
                new_count = result[0] + 1
                if new_count >= MAX_FAILED_ATTEMPTS:
                    blocked_until = now + BLOCK_DURATION
                    cursor.execute('UPDATE failed_attempts SET count = ?, blocked_until = ? WHERE ip_address = ?', 
                                  (new_count, blocked_until, ip_address))
                    logger.warning(f"IP {ip_address} blocked due to {MAX_FAILED_ATTEMPTS} failed attempts")
                else:
                    cursor.execute('UPDATE failed_attempts SET count = ? WHERE ip_address = ?', 
                                  (new_count, ip_address))
            else:
                cursor.execute('INSERT INTO failed_attempts (ip_address, count) VALUES (?, 1)', (ip_address,))
        else:
            cursor.execute('UPDATE failed_attempts SET count = 0 WHERE ip_address = ?', (ip_address,))
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        logger.error(f"Failed to record request: {e}")

def validate_audio_file(file_data, filename):
    secure_name = secure_filename(filename)
    if not secure_name:
        return False, "Invalid filename detected"
    
    if len(file_data) < MIN_FILE_SIZE:
        return False, "File too small to be a valid audio file"
    
    if len(file_data) > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
    
    file_header = file_data[:20]
    is_valid_audio = False
    
    for signature, mime_type in AUDIO_SIGNATURES.items():
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

def security_middleware(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        client_ip = get_client_ip()
        
        try:
            resource_ok, resource_msg = check_system_resources()
            if not resource_ok:
                logger.warning(f"Resource limit hit: {resource_msg}")
                record_request(client_ip, success=False)
                return jsonify({
                    'error': 'Service temporarily overloaded. Please try again in a few minutes.'
                }), 503
            
            user_agent = request.headers.get('User-Agent', '')
            if not user_agent or len(user_agent) < 5:
                logger.warning(f"Suspicious user agent from IP {client_ip}: {user_agent}")
            
            rate_ok, rate_msg = rate_limit_check(client_ip)
            if not rate_ok:
                logger.warning(f"Rate limit exceeded for IP {client_ip}: {rate_msg}")
                return jsonify({'error': rate_msg}), 429
            
            result = f(*args, **kwargs)
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Security middleware error after {processing_time:.2f}s: {str(e)}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'Internal security error'}), 500
    
    return decorated_function

@app.route('/analyze', methods=['POST'])
@security_middleware
def analyze_bpm():
    start_time = time.time()
    client_ip = get_client_ip()
    logger.info(f"BPM analysis request from {client_ip}")
    
    temp_path = None
    
    try:
        if 'audio' not in request.files:
            record_request(client_ip, success=False)
            return jsonify({'error': 'No audio file provided in request'}), 400
        
        file = request.files['audio']
        if not file or not file.filename:
            record_request(client_ip, success=False)
            return jsonify({'error': 'Empty file or missing filename'}), 400
        
        file.seek(0)
        file_data = file.read()
        file.seek(0)
        
        file_size = len(file_data)
        logger.info(f"Processing file: {file.filename} ({file_size / (1024*1024):.1f}MB) from IP {client_ip}")
        
        is_valid, validation_msg = validate_audio_file(file_data, file.filename)
        if not is_valid:
            logger.warning(f"File validation failed: {validation_msg}")
            record_request(client_ip, success=False)
            return jsonify({'error': validation_msg}), 400
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
            file.save(tmp.name)
        
        try:
            loader = es.MonoLoader(filename=temp_path)
            audio = loader()
        except Exception as e:
            logger.error(f"Failed to load audio file: {str(e)}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'Audio file is corrupted or in an unsupported format'}), 400
        
        if len(audio) == 0:
            record_request(client_ip, success=False)
            return jsonify({'error': 'Audio file contains no audio data'}), 400
        
        if len(audio) < 44100:
            record_request(client_ip, success=False)
            return jsonify({'error': 'Audio file too short for BPM analysis (minimum 1 second)'}), 400
        
        max_samples = 60 * 44100
        if len(audio) > max_samples:
            audio = audio[:max_samples]
            logger.info("Audio trimmed to 60 seconds for analysis")
        
        try:
            rhythm_extractor = es.RhythmExtractor2013(method="degara")
            bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)
        except Exception as e:
            logger.error(f"BPM analysis failed: {str(e)}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'BPM analysis failed. Audio may have irregular rhythm or be too quiet'}), 500
        
        if not bpm or bpm <= 0 or bpm > 300:
            logger.warning(f"Invalid BPM detected: {bpm}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'Could not detect valid BPM. Audio may have irregular rhythm or be too quiet'}), 422
        
        bpm_result = round(float(bpm), 1)
        
        total_time = time.time() - start_time
        logger.info(f"Analysis complete: {bpm_result} BPM in {total_time:.2f}s for IP {client_ip}")
        
        record_request(client_ip, success=True)
        
        return jsonify({
            'bpm': bpm_result,
            'confidence': float(beats_confidence) if beats_confidence else 0.0,
            'processing_time': round(total_time, 2),
            'file_size': file_size,
            'audio_duration': len(audio) / 44100
        })
        
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Unexpected error during BPM analysis after {total_time:.2f}s: {str(e)}")
        record_request(client_ip, success=False)
        return jsonify({'error': 'Internal server error during audio processing'}), 500
        
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    try:
        memory_usage = psutil.virtual_memory().percent
        cpu_usage = psutil.cpu_percent(interval=0.1)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(DISTINCT ip_address) FROM rate_limits WHERE timestamp > ?', 
                      (time.time() - 3600,))
        active_ips = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM failed_attempts WHERE blocked_until > ?', (time.time(),))
        blocked_ips = cursor.fetchone()[0]
        conn.close()
        
        status = {
            'status': 'healthy',
            'service': 'bpm-analyzer',
            'memory_usage': f"{memory_usage}%",
            'cpu_usage': f"{cpu_usage}%",
            'active_ips': active_ips,
            'blocked_ips': blocked_ips
        }
        
        if memory_usage > 95 or cpu_usage > 95:
            status['status'] = 'unhealthy'
            return jsonify(status), 503
            
        return jsonify(status)
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy', 
            'error': str(e)
        }), 503

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'error': f'File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024*1024)}MB.'
    }), 413

@app.errorhandler(429)
def ratelimit_handler(error):
    return jsonify({
        'error': 'Too many requests. Please wait before trying again.'
    }), 429

if __name__ == '__main__':
    logger.info("Starting BPM Analyzer backend with SQLite rate limiting")
    app.run(debug=True, host='0.0.0.0', port=8001)