# BPM Analyzer

A fast, accurate BPM detection web application optimized for electronic music and DJ workflows.

## Features

- **Instant BPM Detection** - Upload audio files and get BPM results in 2-6 seconds
- **Electronic Music Optimized** - Uses Essentia's degara algorithm for superior accuracy on house, techno, trance, and hardstyle
- **Multiple Format Support** - MP3, WAV, FLAC, AAC, OGG, M4A files up to 150MB
- **Drag & Drop Interface** - Simple, intuitive file upload with progress tracking
- **Professional Rate Limiting** - Redis-based abuse prevention with elegant countdown UI
- **Mobile Responsive** - Touch-friendly design with professional glass morphism interface

## Live Demo

Visit [https://djbpm.club](https://djbpm.club) to try it out.

## Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend**: Python Flask, Essentia audio analysis library
- **Rate Limiting**: Redis with localStorage persistence
- **Deployment**: Nginx reverse proxy, Gunicorn WSGI server

## Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Ensure Redis is installed and running
sudo apt install redis-server
sudo systemctl start redis-server
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run build  # For production
npm run dev     # For development
```

## Performance

- Processing time: 0.5-1.2 seconds backend analysis
- Total response time: 2-6 seconds including upload
- Accuracy: Optimized for 120-180 BPM electronic music
- Rate limiting: 2 requests per minute per IP

## Security & Rate Limiting

- **File validation** with magic number checking and secure filename handling
- **Redis-based rate limiting** (2 requests/minute) with professional countdown UI
- **Header inspection** and resource monitoring for abuse prevention
- **localStorage persistence** - rate limits survive page refreshes for better UX

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  React Frontend │───►│ Nginx Proxy  │───►│ Flask + Gunicorn │
│  (Static Files) │    │ (Port 80)    │    │   (Port 8001)   │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                      │
                                            ┌─────────────────┐
                                            │ Redis Rate      │
                                            │ Limiting        │
                                            └─────────────────┘
```

## Production Deployment

- **Service Management**: `sudo systemctl restart bpm-analyzer`
- **Nginx Configuration**: `/etc/nginx/sites-available/bmp-analyzer`
- **Logs**: `journalctl -u bmp-analyzer -f`
- **Health Check**: `http://your-server/api/health`

## License

MIT License - see LICENSE file for details.

## Credits

Created by [DJ ECM](https://djecm.club) - Professional BPM analysis for the electronic music community.