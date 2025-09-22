# BPM Analyzer

A fast, accurate BPM detection web application optimized for electronic music and DJ workflows.

## Features

- **Instant BPM Detection** - Upload audio files and get BPM results in 2-6 seconds
- **Electronic Music Optimized** - Uses Essentia's degara algorithm for superior accuracy on house, techno, trance, and hardstyle
- **Multiple Format Support** - MP3, WAV, FLAC, AAC, OGG, M4A files up to 150MB
- **Drag & Drop Interface** - Simple, intuitive file upload with progress tracking
- **Rate Limited & Secure** - Comprehensive security measures prevent abuse

## Live Demo

Visit [https://djbpm.club](https://djbpm.club) to try it out.

## Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend**: Python Flask, Essentia audio analysis library
- **Deployment**: Nginx reverse proxy, Gunicorn WSGI server

## Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Performance

- Processing time: 0.5-1.2 seconds backend analysis
- Total response time: 2-6 seconds including upload
- Accuracy: Optimized for 120-180 BPM electronic music

## Security

- File validation with magic number checking
- Rate limiting (100 requests/hour, 2 requests/minute)
- Header inspection and bot detection
- Resource monitoring and abuse prevention

## License

MIT License - see LICENSE file for details.