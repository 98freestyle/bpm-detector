from flask import Flask, request, jsonify
from flask_cors import CORS
import essentia
import essentia.standard as es
import tempfile
import os
import time
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_bpm():
    start_time = time.time()
    logger.info("BPM analysis request received")
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    file = request.files['audio']
    temp_path = None
    
    try:
        # File size check (150MB limit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        max_size = 150 * 1024 * 1024  # 150MB
        if file_size > max_size:
            return jsonify({'error': 'File too large. Maximum 150MB allowed.'}), 413
            
        logger.info(f"Processing file of size: {file_size / (1024*1024):.1f}MB")
        
        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
            file.save(tmp.name)
        
        file_save_time = time.time()
        logger.info(f"File saved in {file_save_time - start_time:.2f}s")
        
        # Load audio with Essentia - optimized loading
        loader = es.MonoLoader(filename=temp_path)
        audio = loader()
        
        load_time = time.time()
        logger.info(f"Audio loaded in {load_time - file_save_time:.2f}s, length: {len(audio)/44100:.1f}s")
        
        # Trim to first 60 seconds for analysis (major speed optimization)
        max_samples = 60 * 44100  # 60 seconds at 44.1kHz
        if len(audio) > max_samples:
            audio = audio[:max_samples]
            logger.info("Audio trimmed to 60 seconds for analysis")
        
        trim_time = time.time()
        logger.info(f"Audio trimmed in {trim_time - load_time:.2f}s")
        
        # Use optimized RhythmExtractor2013
        rhythm_extractor = es.RhythmExtractor2013(method="degara")
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)
        
        analysis_time = time.time()
        logger.info(f"BPM analysis completed in {analysis_time - trim_time:.2f}s")
        
        # Round BPM to nearest integer
        bpm_result = int(round(bpm))
        bpm_result = round(float(bpm), 1) 
        
        total_time = time.time() - start_time
        logger.info(f"Total processing time: {total_time:.2f}s, BPM: {bpm_result}")
        
        return jsonify({
            'bpm': bpm_result,
            'confidence': float(beats_confidence),
            'processing_time': round(total_time, 2)
        })
        
    except Exception as e:
        logger.error(f"Error during BPM analysis: {str(e)}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500
        
    finally:
        # Cleanup temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'bpm-analyzer'})

if __name__ == '__main__':
    app.run(debug=True)