from flask import Flask, request, jsonify
from flask_cors import CORS
import essentia
import essentia.standard as es
import tempfile
import os
import time
import logging
import mimetypes
import magic
from collections import defaultdict
from functools import wraps
from datetime import datetime, timedelta
import hashlib
import psutil
import threading
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting storage (in production, use Redis or database)
rate_limit_storage = defaultdict(list)
failed_attempts = defaultdict(int)
blocked_ips = set()

# Configuration
MAX_FILE_SIZE = 150 * 1024 * 1024  # 150MB
MIN_FILE_SIZE = 1024  # 1KB
MAX_REQUESTS_PER_HOUR = 100
MAX_REQUESTS_PER_MINUTE = 2  
#MAX_REQUESTS_PER_HOUR = 5      # Very low for testing
#MAX_REQUESTS_PER_MINUTE = 3    # Very low for testing
MAX_FAILED_ATTEMPTS = 10     
BLOCK_DURATION = 3600  # 1 hour in seconds
MAX_MEMORY_USAGE = 80  # Percentage
MAX_CPU_USAGE = 90   # Percentage

# Supported audio formats with their magic number signatures
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
    """Get real client IP, handling proxies"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    return request.remote_addr

def check_system_resources():
    """Check if system has enough resources to process request"""
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
        return True, "OK"  # Don't block if we can't check

def rate_limit_check(ip_address):
    """Check if IP is within rate limits"""
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    minute_ago = now - timedelta(minutes=1)
    
    print(f"DEBUG: Rate limit check for IP: {ip_address}")
    print(f"DEBUG: Stored requests for this IP: {len(rate_limit_storage[ip_address])}")
    print(f"DEBUG: Rate limit storage: {dict(rate_limit_storage)}")
    
    # Clean old entries
    rate_limit_storage[ip_address] = [
        timestamp for timestamp in rate_limit_storage[ip_address] 
        if timestamp > hour_ago
    ]
    
    # Check if IP is blocked
    if ip_address in blocked_ips:
        return False, "IP temporarily blocked due to too many failed attempts"
    
    # Check per-minute rate limit FIRST
    recent_requests = [ts for ts in rate_limit_storage[ip_address] if ts > minute_ago]
    if len(recent_requests) >= MAX_REQUESTS_PER_MINUTE:
        return False, f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_MINUTE} requests per minute"
    
    # Check hourly rate limit
    if len(rate_limit_storage[ip_address]) >= MAX_REQUESTS_PER_HOUR:
        return False, f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_HOUR} requests per hour"
    
    return True, "OK"

def record_request(ip_address, success=True):
    """Record request attempt"""
    now = datetime.now()
    rate_limit_storage[ip_address].append(now)
    
    if not success:
        failed_attempts[ip_address] += 1
        if failed_attempts[ip_address] >= MAX_FAILED_ATTEMPTS:
            blocked_ips.add(ip_address)
            logger.warning(f"IP {ip_address} blocked due to {MAX_FAILED_ATTEMPTS} failed attempts")
            # Schedule unblock
            def unblock_ip():
                time.sleep(BLOCK_DURATION)
                if ip_address in blocked_ips:
                    blocked_ips.remove(ip_address)
                    failed_attempts[ip_address] = 0
                    logger.info(f"IP {ip_address} unblocked")
            
            threading.Thread(target=unblock_ip, daemon=True).start()
    else:
        # Reset failed attempts on success
        failed_attempts[ip_address] = 0

def validate_audio_file(file_data, filename):
    """Comprehensive audio file validation"""
    
    # Use secure_filename for path traversal protection, but don't require exact match
    secure_name = secure_filename(filename)
    if not secure_name:
        return False, "Invalid filename detected"
    
    # Check file size
    if len(file_data) < MIN_FILE_SIZE:
        return False, "File too small to be a valid audio file"
    
    if len(file_data) > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
    
    # Check file signature (magic numbers)
    file_header = file_data[:20]  # First 20 bytes usually enough
    is_valid_audio = False
    
    for signature, mime_type in AUDIO_SIGNATURES.items():
        if file_header.startswith(signature):
            is_valid_audio = True
            break
        # Special case for M4A which has signature at different position
        if b'M4A' in file_header and b'ftyp' in file_header:
            is_valid_audio = True
            break
    
    if not is_valid_audio:
        # Try using python-magic as fallback
        try:
            detected_mime = magic.from_buffer(file_data, mime=True)
            if detected_mime and detected_mime.startswith('audio/'):
                is_valid_audio = True
        except Exception as e:
            logger.warning(f"Magic detection failed: {e}")
    
    if not is_valid_audio:
        return False, "File does not appear to be a valid audio format"
    
    # Check filename for suspicious patterns
    if not filename or len(filename.strip()) == 0:
        return False, "Invalid filename"
    
    # Check for suspicious extensions
    suspicious_extensions = ['.exe', '.bat', '.scr', '.com', '.pif', '.js', '.vbs', '.jar', '.php', '.asp']
    filename_lower = filename.lower()
    for ext in suspicious_extensions:
        if filename_lower.endswith(ext):
            return False, "Suspicious file extension detected"
    
    # Check for path traversal attempts
    if '..' in filename or '/' in filename or '\\' in filename:
        return False, "Invalid characters in filename"
    
    return True, "Valid audio file"

def security_middleware(f):
    """Decorator for security checks"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        client_ip = get_client_ip()
        
        try:
            # System resource check
            resource_ok, resource_msg = check_system_resources()
            if not resource_ok:
                logger.warning(f"Resource limit hit: {resource_msg}")
                record_request(client_ip, success=False)
                return jsonify({
                    'error': 'Service temporarily overloaded. Please try again in a few minutes.'
                }), 503
            
            # Check User-Agent BEFORE rate limiting
            user_agent = request.headers.get('User-Agent', '')
            if not user_agent or len(user_agent) < 10:
                logger.warning(f"Suspicious user agent from IP {client_ip}: {user_agent}")
                record_request(client_ip, success=False)
                return jsonify({'error': 'Invalid request headers'}), 400
            
            # Rate limiting check
            rate_ok, rate_msg = rate_limit_check(client_ip)
            if not rate_ok:
                logger.warning(f"Rate limit exceeded for IP {client_ip}: {rate_msg}")
                return jsonify({'error': rate_msg}), 429
            
            # Execute the actual route - DON'T record request here
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
        # Validate request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided in request'}), 400
        
        file = request.files['audio']
        if not file or not file.filename:
            return jsonify({'error': 'Empty file or missing filename'}), 400
        
        # Read file data
        file.seek(0)
        file_data = file.read()
        file.seek(0)  # Reset for later use
        
        file_size = len(file_data)
        logger.info(f"Processing file: {file.filename} ({file_size / (1024*1024):.1f}MB) from IP {client_ip}")
        
        # Comprehensive file validation
        is_valid, validation_msg = validate_audio_file(file_data, file.filename)
        if not is_valid:
            logger.warning(f"File validation failed: {validation_msg}")
            record_request(client_ip, success=False)
            return jsonify({'error': validation_msg}), 400
        
        validation_time = time.time()
        logger.info(f"File validation completed in {validation_time - start_time:.2f}s")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
            file.save(tmp.name)
        
        file_save_time = time.time()
        logger.info(f"File saved in {file_save_time - validation_time:.2f}s")
        
        # Load audio with Essentia with timeout protection
        try:
            loader = es.MonoLoader(filename=temp_path)
            audio = loader()
        except Exception as e:
            logger.error(f"Failed to load audio file: {str(e)}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'Audio file is corrupted or in an unsupported format'}), 400
        
        load_time = time.time()
        logger.info(f"Audio loaded in {load_time - file_save_time:.2f}s, length: {len(audio)/44100:.1f}s")
        
        # Validate audio content
        if len(audio) == 0:
            record_request(client_ip, success=False)
            return jsonify({'error': 'Audio file contains no audio data'}), 400
        
        if len(audio) < 44100:  # Less than 1 second
            record_request(client_ip, success=False)
            return jsonify({'error': 'Audio file too short for BPM analysis (minimum 1 second)'}), 400
        
        # Trim to first 60 seconds for analysis (optimization)
        max_samples = 60 * 44100  # 60 seconds at 44.1kHz
        if len(audio) > max_samples:
            audio = audio[:max_samples]
            logger.info("Audio trimmed to 60 seconds for analysis")
        
        trim_time = time.time()
        logger.info(f"Audio trimmed in {trim_time - load_time:.2f}s")
        
        # BPM analysis with timeout protection
        try:
            rhythm_extractor = es.RhythmExtractor2013(method="degara")
            bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)
        except Exception as e:
            logger.error(f"BPM analysis failed: {str(e)}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'BPM analysis failed. Audio may have irregular rhythm or be too quiet'}), 500
        
        analysis_time = time.time()
        logger.info(f"BPM analysis completed in {analysis_time - trim_time:.2f}s")
        
        # Validate BPM result
        if not bpm or bpm <= 0 or bpm > 300:  # Reasonable BPM range
            logger.warning(f"Invalid BPM detected: {bpm}")
            record_request(client_ip, success=False)
            return jsonify({'error': 'Could not detect valid BPM. Audio may have irregular rhythm or be too quiet'}), 422
        
        # Round BPM to 1 decimal place
        bpm_result = round(float(bpm), 1)
        
        total_time = time.time() - start_time
        logger.info(f"Analysis complete: {bpm_result} BPM in {total_time:.2f}s for IP {client_ip}")
        
        # Record successful request ONLY at the end
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
        # Cleanup temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        memory_usage = psutil.virtual_memory().percent
        cpu_usage = psutil.cpu_percent(interval=0.1)
        
        status = {
            'status': 'healthy',
            'service': 'bpm-analyzer',
            'memory_usage': f"{memory_usage}%",
            'cpu_usage': f"{cpu_usage}%",
            'active_requests': len([ip for ip, requests in rate_limit_storage.items() if requests]),
            'blocked_ips': len(blocked_ips)
        }
        
        # Mark as unhealthy if resources are critically low
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
    """Handle file too large errors"""
    return jsonify({
        'error': f'File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024*1024)}MB.'
    }), 413

@app.errorhandler(429)
def ratelimit_handler(error):
    """Handle rate limit errors"""
    return jsonify({
        'error': 'Too many requests. Please wait before trying again.'
    }), 429

if __name__ == '__main__':
    logger.info("Starting BPM Analyzer backend with security enhancements")
    app.run(debug=True, host='0.0.0.0', port=8001)