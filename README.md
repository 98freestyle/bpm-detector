# DJBPM

A web app that works out the BPM and musical key of a track. Drop in an audio file and you get the tempo and key back in a few seconds. It's built for DJs and producers, and tuned for electronic music like house, techno and trance.

**Live site:** https://djbpm.club

![DJBPM preview](frontend/public/preview.png)

## Features

- BPM detection using Essentia's RhythmExtractor2013 (degara method), which suits steady electronic beats
- Key detection, shown when the confidence is high enough to be useful for harmonic mixing
- Supports MP3, WAV, FLAC, OGG and M4A files up to 150MB (minimum length is 4 seconds)
- Large files are trimmed in the browser before upload, so big tracks don't take forever to send
- Only the first 60 seconds of a track are analysed, which keeps responses quick
- Redis-backed rate limiting (10 requests a minute, 100 an hour per IP) with a countdown in the UI
- Server-side file checks: magic number inspection, filename checks, size limits and cleanup of temp files
- Password protected admin dashboard at `/admin` with request counts, success and error rates and recent errors
- Structured error codes from the API, mapped to plain messages in the UI
- Recent results are kept in the page so you can compare a few tracks side by side

## Built with

**Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, React Router

**Backend:** Python, Flask, Essentia, Gunicorn, Redis, python-magic, psutil

**Hosting:** Nginx serves the built frontend and proxies `/api/` to Gunicorn, on a VPS.

## How it fits together

```
Browser (React) -> Nginx -> Gunicorn / Flask (127.0.0.1:8001) -> Redis
                     |
                     +-> static files from frontend/dist
```

## Running it locally

You'll need Python 3.10+, Node 20+, and the libmagic system library (`sudo apt install libmagic1` on Debian or Ubuntu, `brew install libmagic` on macOS). Essentia's wheels are for Linux and macOS, so on Windows use WSL.

Redis is optional locally. Without it the app still runs, but rate limiting and the admin stats are switched off.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # then set ADMIN_USERNAME and ADMIN_PASSWORD if you want /admin
python app.py            # listens on http://127.0.0.1:8001
```

To start Redis quickly, run `docker run -p 6379:6379 redis`.

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, /api is proxied to the backend
```

Build for production with `npm run build`. The output goes to `frontend/dist`.

### Production notes

Run the backend with `gunicorn -c gunicorn.conf.py app:app` from the `backend` folder, behind a reverse proxy. The app takes the client IP from the `X-Real-IP` header, so your proxy needs to set it, and Gunicorn should only be reachable through the proxy. Nginx's `client_max_body_size` should be at least 200M to match the app's request limit.

## Tests

Two scripts in the project root poke at a running backend. They target `http://localhost:8001` by default, or pass a different URL as the first argument.

```bash
python security_tests.py              # file validation, bad requests, light load
python rate_limit_test.py             # checks the rate limiter kicks in
```

Only point these at a server you own. The rate limit test expects you to lower the limits in `backend/app.py` first.

## Project layout

```
backend/    Flask API, Gunicorn config, requirements
frontend/   React app (Vite)
security_tests.py, rate_limit_test.py
```

## Author

Built by DJ ECM ([djecm.club](https://djecm.club)).
