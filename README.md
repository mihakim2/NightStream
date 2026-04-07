<div align="center">

# NightStream

**Self-hosted IPTV player for your browser**

Point it at your M3U playlist or Xtream Codes credentials.\
Watch from any browser on your network.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)

<br />

<img src="https://img.shields.io/badge/Live_TV-4f8eff?style=for-the-badge" />
<img src="https://img.shields.io/badge/VOD-a855f7?style=for-the-badge" />
<img src="https://img.shields.io/badge/Series-f97316?style=for-the-badge" />
<img src="https://img.shields.io/badge/EPG-14b8a6?style=for-the-badge" />
<img src="https://img.shields.io/badge/Search-6366f1?style=for-the-badge" />

</div>

---

## Why NightStream?

Most IPTV players are either mobile-only apps, riddled with ads, or require sketchy APKs. NightStream is a clean, open-source alternative that runs on your own machine and streams to any browser — laptop, phone, tablet, or TV.

No cloud. No tracking. No subscriptions. Just your playlist and a browser.

---

## Features

| | Feature | Description |
|---|---|---|
| **Playlist** | M3U & Xtream Codes | Add multiple providers, switch between them |
| **Live TV** | Channel browser | Categories, logos, EPG now/next, grid & list views |
| **VOD** | On-demand library | Netflix-style category rows, detail modals |
| **Series** | Smart grouping | Auto-detects S01E01 patterns, groups into seasons |
| **Guide** | EPG grid | Timeline view with current-time indicator |
| **Player** | Multi-format | HLS, MPEG-TS, MKV, MP4 with adaptive streaming |
| **Search** | Real-time | Search across channels, movies, and series |
| **Favorites** | Quick access | Save channels and content across sessions |
| **Parental** | PIN lock | Restrict categories by keyword |
| **Mobile** | Responsive | Bottom tab nav, touch-optimized, works on phones |

---

## Quick Start

```bash
git clone https://github.com/mihakim2/NightStream.git
cd nightstream

# Install dependencies
npm install
cd client && npm install && cd ..

# Start
npm run dev
```

Open **http://localhost:5173** and add your playlist.

> **Requirements:** Node.js 18+ and an M3U playlist URL or Xtream Codes credentials.

---

## How It Works

```
Browser (any device)
    │
    │  http://localhost:5173
    │
┌───┴──────────────────────────────────┐
│  Frontend (React + Vite)             │
│  HLS.js / mpegts.js video playback   │
└───┬──────────────────────────────────┘
    │  /api/*
┌───┴──────────────────────────────────┐
│  Backend (Express, port 3000)        │
│  ├─ Playlist parser (M3U / Xtream)   │
│  ├─ Stream proxy (CORS, SSL, Range)  │
│  ├─ EPG engine (XMLTV)              │
│  └─ Local JSON storage              │
└──────────────────────────────────────┘
```

All data stays on your machine. Settings, favorites, and playlists are stored as JSON files in a local `data/` directory.

---

## Access From Other Devices

### Local Network

Find your machine's IP and open `http://192.168.x.x:5173` from any device on your Wi-Fi.

### Tailscale (Recommended)

[Tailscale](https://tailscale.com) creates a secure mesh VPN — no port forwarding, works from anywhere.

```bash
# On the NightStream machine
tailscale up
tailscale ip -4   # e.g. 100.64.x.x

# On any other device with Tailscale
# Open http://100.64.x.x:5173
```

Works from home, hotel, office, phone — anywhere both devices are on your tailnet.

> **Tip:** Enable [MagicDNS](https://tailscale.com/kb/1081/magicdns/) to use `http://your-machine-name:5173` instead of the IP.

---

## Player Controls

| Key | Action |
|:---:|--------|
| `Space` | Play / Pause |
| `←` `→` | Skip back / forward 30s |
| `↑` `↓` | Volume up / down |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `Esc` | Close player |

**Touch:** Double-tap left/right side of video to skip 30s. Double-tap center for fullscreen.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 18+ |
| Backend | Express |
| Frontend | React 18, Vite |
| Video | HLS.js, mpegts.js |
| Styling | CSS Modules |
| Storage | Local JSON files |

---

## Project Structure

```
nightstream/
├── server/
│   ├── index.js              # Express entry
│   ├── routes/               # API endpoints
│   └── services/             # Playlist parsing, EPG, storage
├── client/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # React hooks
│   │   └── api/              # API client
│   └── vite.config.js
├── package.json
└── README.md
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)
