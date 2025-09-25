# BPM Analyzer

Fast, accurate BPM and key detection web application optimized for electronic music and DJ workflows.

## Features

- **Instant BPM Detection** - Upload audio files and get BPM results in seconds
- **Key Detection** - Musical key analysis for harmonic mixing workflows
- **Loop Optimization** - Automatic processing enhancement for short producer loops
- **Electronic Music Optimized** - Uses Essentia's degara algorithm for house, techno, trance, and hardstyle
- **Multiple Format Support** - MP3, WAV, FLAC, AAC, OGG, M4A files up to 150MB
- **Professional Rate Limiting** - Redis-based abuse prevention with elegant countdown UI
- **Mobile Responsive** - Touch-friendly design with professional dark interface

## Live Demo

Visit [https://djbpm.club](https://djbpm.club) to try it out.

## Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend**: Python Flask, Essentia audio analysis library
- **Rate Limiting**: Redis with localStorage persistence
- **Deployment**: Nginx reverse proxy, Gunicorn WSGI server

## Performance

- Processing time: 1.5-1.7 seconds backend analysis
- Total response time: 6-7 seconds including upload
- BPM accuracy: Optimized for electronic music (95%+ accuracy)
- Key accuracy: ~70-80% for electronic music
- Rate limiting: 2 requests per minute per IP

## Security & Rate Limiting

- **File validation** with magic number checking and secure filename handling
- **Redis-based rate limiting** with professional countdown UI
- **Header inspection** and resource monitoring for abuse prevention
- **localStorage persistence** - rate limits survive page refreshes

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
- **Nginx Configuration**: `/etc/nginx/sites-available/bpm-analyzer`
- **Logs**: `journalctl -u bmp-analyzer -f`
- **Health Check**: `http://your-server/api/health`

## License

MIT License - see LICENSE file for details.

## Credits

Created by [DJ ECM](https://djecm.club) - Professional BPM analysis for the electronic music community.