# BPM Analyzer

A modern web application for detecting BPM (beats per minute) in audio files.

## Architecture

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Python Flask + librosa
- **Processing**: Server-side audio analysis for high accuracy

## Development Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend  
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install flask librosa flask-cors
python app.py
```

## Features
- Drag & drop file upload
- High-accuracy BPM detection for electronic music
- Modern responsive UI
- Fast server-side processing