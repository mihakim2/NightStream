# NightStream

A self-hosted, browser-based IPTV playlist player. Point it at your M3U playlist or Xtream Codes credentials and watch from any browser on your network.

Runs locally — no cloud, no tracking, no third-party services.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Playlist Support** — M3U URLs and Xtream Codes API
- **Live TV** — Browse channels by category, with EPG program info
- **VOD** — Browsable on-demand library with category filtering
- **Series** — Smart episode detection with season/episode grouping
- **Program Guide** — Timeline-based EPG grid
- **Video Player** — HLS, MPEG-TS, and MKV playback with keyboard shortcuts, seek, skip 30s, aspect ratio control, multi-audio track support
- **Search** — Real-time search across all content
- **Favorites** — Save channels and content for quick access
- **Parental Controls** — PIN-lock categories by keyword
- **Dark Theme** — Cinematic UI designed for big screens and mobile
- **Multiple Playlists** — Add and switch between providers

## Quick Start

```bash
git clone https://github.com/yourusername/nightstream.git
cd nightstream
npm install
cd client && npm install && cd ..
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and add your playlist.

### Requirements

- Node.js 18+
- An M3U playlist URL or Xtream Codes credentials

## How It Works

NightStream runs two processes:

- **Backend** (port 3000) — Express server that parses playlists, proxies streams (handling CORS, SSL, and range requests), fetches EPG data, and stores settings/favorites as local JSON files
- **Frontend** (port 5173) — React SPA with HLS.js and mpegts.js for video playback

All data stays on your machine. Nothing is sent to any external service.

## Access Across Your Network

### Option 1: Direct IP

Find your machine's local IP (`ifconfig` or `ipconfig`) and open `http://192.168.x.x:5173` from any device on your network.

### Option 2: Tailscale (Recommended)

[Tailscale](https://tailscale.com) creates a secure mesh VPN across your devices — no port forwarding, works anywhere.

1. Install Tailscale on the machine running NightStream and on your viewing devices
2. Run `tailscale up` on both
3. Find the NightStream machine's Tailscale IP: `tailscale ip -4`
4. Open `http://<tailscale-ip>:5173` from any device on your tailnet

This works from anywhere — not just your local network.

**Tip:** Enable [MagicDNS](https://tailscale.com/kb/1081/magicdns/) for a friendly hostname like `http://your-machine-name:5173`.

## Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| ← → | Skip back / forward 30s |
| ↑ ↓ | Volume up / down |
| F | Fullscreen |
| M | Mute |
| Esc | Close player |

Double-tap the left/right side of the video to skip 30s.

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React 18, Vite
- **Video:** HLS.js, mpegts.js
- **Styling:** CSS Modules
- **Storage:** Local JSON files (no database)

## License

MIT
