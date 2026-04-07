# NightStream

A self-hosted, browser-based IPTV player. Connect your M3U playlist or Xtream Codes provider and stream live TV, movies, and series from any browser on your network.

Built as a personal alternative to apps like iboIPTV — runs locally, no cloud, no subscriptions.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Live TV** — Browse channels by category, with EPG program info
- **Movies** — Netflix-style browsable VOD library
- **Series** — Season and episode navigation
- **Program Guide** — Timeline-based EPG grid
- **Video Player** — HLS and MPEG-TS playback, keyboard shortcuts, seek, skip 30s, aspect ratio control, multi-audio track support
- **Search** — Real-time search across all content
- **Favorites** — Save channels, movies, and series
- **Parental Controls** — PIN-lock adult content categories
- **Dark Theme** — Cinematic dark UI designed for big screens
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
- An M3U playlist URL or Xtream Codes credentials from your IPTV provider

## How It Works

NightStream runs two processes:

- **Backend** (port 3000) — Express server that parses playlists, proxies streams (bypassing CORS and SSL issues), fetches EPG data, and stores settings/favorites as local JSON files
- **Frontend** (port 5173) — React SPA with HLS.js and mpegts.js for video playback

All data stays on your machine. Nothing is sent anywhere.

## Access Across Your Home Network

### Option 1: Direct IP

Find your machine's local IP (`ifconfig` or `ipconfig`) and open `http://192.168.x.x:5173` from any device on your network.

### Option 2: Tailscale (Recommended)

[Tailscale](https://tailscale.com) creates a secure mesh VPN across your devices — no port forwarding, works anywhere.

1. Install Tailscale on the machine running NightStream and on your viewing devices
2. Run `tailscale up` on both
3. Find the NightStream machine's Tailscale IP: `tailscale ip -4`
4. Open `http://<tailscale-ip>:5173` from any device on your tailnet

This works from anywhere — not just your local network. Stream from a hotel, office, or phone.

**Tip:** For a stable hostname, enable [MagicDNS](https://tailscale.com/kb/1081/magicdns/) and access via `http://your-machine-name:5173`.

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
