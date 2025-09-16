from flask import Flask, request, jsonify
from flask_cors import CORS
import essentia
import essentia.standard as es
import tempfile
import os

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_bpm():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    file = request.files['audio']
    temp_path = None
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
            file.save(tmp.name)
        
        # Load audio with Essentia
        loader = es.MonoLoader(filename=temp_path)
        audio = loader()
        
        # Use RhythmExtractor2013 - the actual algorithm
        rhythm_extractor = es.RhythmExtractor2013()
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)
        
        return jsonify({'bpm': int(round(bpm))})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

if __name__ == '__main__':
    app.run(debug=True)