# BPM Analyzer

A fast, accurate web application for detecting BPM (beats per minute) in audio files, optimized for electronic music and DJ tracks.

## Live Demo
🔗 **https://djbpm.club** (SSL and domain setup in progress)

## Features
- **Drag & drop file upload** with real-time progress tracking
- **High-accuracy BPM detection** using Essentia's degara algorithm
- **Optimized for electronic music** - perfect accuracy for house, techno, trance, hardstyle, schranz
- **Fast processing** - most tracks analyzed in under 6 seconds
- **Comprehensive file validation** with helpful error messages
- **Rate limiting and abuse protection** to ensure service stability
- **Modern responsive UI** built with React, Tailwind CSS, and Framer Motion

## Supported Formats
- MP3, WAV, FLAC, AAC, OGG, M4A
- Up to 150MB file size
- Automatic optimization for large files

## Architecture

### Frontend
- **React 19** with Vite for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for smooth animations
- **File slicing** optimization for faster uploads

### Backend  
- **Python Flask** with Essentia for audio analysis
- **degara algorithm** for electronic music accuracy
- **Comprehensive security** with file validation and rate limiting
- **Gunicorn** WSGI server for production
- **Nginx** reverse proxy (configured separately)

## Development Setup

### Frontend
```bash
cd frontend
npm install
npm run dev  # Development server at localhost:5173
```

### Backend  
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py  # Development server at localhost:8001
```

For frontend development, the Vite dev server will proxy API requests to the live backend.

### Production Build
```bash
cd frontend
npm run build  # Creates dist/ folder for deployment
```

## Algorithm Details

The app uses **Essentia's RhythmExtractor2013 with degara method**, which provides:
- Superior accuracy for electronic music with consistent beats
- Faster processing compared to multifeature method
- Reliable detection for BPM ranges 80-200 (typical for DJ music)

## Security Features

- File signature verification (not just extension checking)
- Rate limiting: 10 requests per hour per IP
- Automatic blocking after failed attempts
- Resource usage monitoring
- Comprehensive input validation
- Secure temporary file handling

## Performance

- **Processing time**: ~0.5-1.2 seconds for most files
- **Total analysis time**: 2-6 seconds including upload
- **File optimization**: Large files automatically trimmed for faster processing
- **Memory efficient**: 60-second analysis window to prevent resource exhaustion

## Recent Updates

- Switched to degara algorithm for perfect electronic music accuracy
- Added comprehensive error handling with user-friendly messages
- Implemented backend security and rate limiting
- Enhanced file validation and progress tracking
- Fixed console logging and timing calculations

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and improvements.

## Contributing

This project is optimized for electronic music analysis. If you're working with other genres, you may want to experiment with different Essentia algorithms or analysis parameters.

## License

Open source project for music production and DJ use cases.