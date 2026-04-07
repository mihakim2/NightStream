# XtreamPlayer — Browser-Based IPTV Player Design Spec

## Overview

A locally-run, browser-based IPTV player that replicates the iboIPTV experience. Supports M3U playlists and Xtream Codes API credentials. Runs via a single `npm start` command — Node.js backend + React frontend.

## Architecture

```
Browser (React SPA + HLS.js)
        │ REST API (localhost:3000)
Node.js/Express Backend
  ├── Playlist Parser (M3U + Xtream Codes API)
  ├── Stream Proxy (CORS bypass, HLS rewriting)
  ├── EPG Engine (XMLTV fetch + parse + cache)
  └── Local JSON Store (favorites, settings, playlists)
```

### Backend

**Playlist Manager**
- Accepts M3U URLs or Xtream Codes credentials (server URL, username, password)
- Parses M3U into structured data: channels grouped by category, with logos, stream URLs
- Xtream Codes mode: calls the XC API for live categories, VOD categories, series (with seasons/episodes), EPG, and catch-up stream URLs
- Supports multiple playlists with switching
- Auto-refreshes playlist data on app launch

**Stream Proxy**
- `GET /api/proxy/stream?url=<encoded_url>` — proxies any video stream
- For HLS streams: rewrites `.m3u8` manifests so segment URLs route through the proxy
- Handles TS, HLS, and direct MP4 streams
- Sets appropriate CORS headers for browser playback

**EPG Engine**
- Fetches XMLTV data from provider URL or Xtream Codes API
- Parses into per-channel program schedules
- Caches parsed EPG as JSON (refreshes every 12 hours)
- Provides: current program, next program, and full grid data
- Endpoint: `GET /api/epg/:channelId` and `GET /api/epg/grid?from=&to=`

**Local JSON Store**
- File: `data/settings.json` — playlist configs, EPG URL, player preferences
- File: `data/favorites.json` — favorited channel/VOD/series IDs per playlist
- File: `data/recents.json` — recently watched items
- No database dependency

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/playlists` | List configured playlists |
| POST | `/api/playlists` | Add playlist (M3U URL or XC creds) |
| DELETE | `/api/playlists/:id` | Remove playlist |
| GET | `/api/live/categories` | Live TV category list |
| GET | `/api/live/channels?category=` | Channels, optionally filtered |
| GET | `/api/vod/categories` | VOD category list |
| GET | `/api/vod/movies?category=` | Movies, optionally filtered |
| GET | `/api/series/categories` | Series category list |
| GET | `/api/series?category=` | Series list |
| GET | `/api/series/:id` | Series detail with seasons/episodes |
| GET | `/api/epg/:channelId` | EPG for a channel |
| GET | `/api/epg/grid` | Full EPG grid data |
| GET | `/api/proxy/stream` | Stream proxy |
| GET | `/api/search?q=` | Global search |
| GET | `/api/favorites` | Get favorites |
| POST | `/api/favorites` | Toggle favorite |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

### Frontend

**Tech**: React 18, Vite, HLS.js, CSS Modules

**Pages/Views:**

1. **Setup** — First-run onboarding. Two tabs: "M3U URL" and "Xtream Codes". Input fields, test connection button, save. Also accessible from settings to manage playlists.

2. **Live TV** — Left sidebar lists channel categories (collapsible). Main area: grid of channel tiles. Each tile shows: channel logo, name, current program title, progress bar. Click to play in the video player overlay. Toggle between grid and list view.

3. **Movies (VOD)** — Horizontal scrolling rows per category (Netflix-style). Movie cards: poster image, title, year. Click opens detail modal: poster, description, duration, play button. Category filter dropdown at top.

4. **Series** — Same layout as Movies. Click series card to open detail: series poster, description, season tabs, episode list per season. Each episode: title, description, duration, play button.

5. **EPG (Program Guide)** — Grid layout: channels as rows, 30-min time slots as columns. Current time vertical indicator (red line). Horizontal scroll for timeline, vertical scroll for channels. Click any program cell for details popup. Catch-up programs visually marked and playable.

6. **Favorites** — Three tabs: Channels, Movies, Series. Shows favorited items in grid layout. Heart icon toggle on all content cards throughout the app.

7. **Search** — Top nav search bar. Real-time results grouped by type (Live, Movies, Series). Keyboard shortcut: `/` to focus search.

8. **Settings** — Manage playlists (add/remove/switch), EPG source URL, player defaults (preferred audio language, subtitle language, default aspect ratio), UI preferences.

**Video Player:**
- Full-screen overlay with semi-transparent backdrop
- HLS.js for adaptive bitrate streaming
- Controls (auto-hide after 3s of inactivity):
  - Play/pause, seek bar with preview, volume slider
  - Audio track selector dropdown
  - Subtitle track selector dropdown
  - Aspect ratio toggle: Fit / Fill / 16:9 / 4:3
  - Fullscreen toggle (native browser fullscreen)
- Keyboard shortcuts:
  - Space: play/pause
  - Left/Right arrows: seek -10s/+10s
  - Up/Down arrows: volume
  - F: fullscreen
  - M: mute
  - Escape: close player
- Channel up/down when playing live TV (Page Up/Page Down)

**Navigation:**
- Top navigation bar: Live TV | Movies | Series | EPG | Favorites | Search | Settings
- Active tab highlighted with accent color underline
- Breadcrumb for deep views (Series > Show > Season)

### UI/UX Design

**Theme:**
- Background: #0a0a0f (near-black)
- Surface: #141420 (cards, sidebars)
- Surface hover: #1c1c30
- Text primary: #e8e8f0
- Text secondary: #8888a0
- Accent: #4f8eff (electric blue)
- Accent hover: #6ba0ff
- Danger: #ff4f6a
- Success: #4fff8e
- Border radius: 8px (cards), 12px (modals)
- Font: system-ui stack (Inter-like feel)

**Visual Polish:**
- Glassmorphism on overlays: `backdrop-filter: blur(20px)` with semi-transparent backgrounds
- Smooth transitions: 200ms ease on hovers, 300ms on page transitions
- Skeleton loaders while content fetches
- Fade-in animations on content grid items (staggered)
- Channel logos with fallback to styled initials
- Movie/series posters with lazy loading and blur-up placeholder
- EPG progress bars with gradient fills
- Focus rings for keyboard navigation (blue glow)

**Responsive:**
- Optimized for 1280px+ (full-screen browser on a monitor/TV)
- Functional down to 768px (tablet)
- CSS Grid for layouts, flexbox for components

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Backend | Express.js |
| Frontend | React 18 + Vite |
| Video | HLS.js |
| M3U Parse | Custom parser (simple format) |
| XML Parse | xml2js (for XMLTV EPG) |
| HTTP | node-fetch (backend), browser fetch (frontend) |
| Styling | CSS Modules |
| Build | Vite (frontend), Node.js native (backend) |
| Dev | Concurrently (run both with one command) |

### Project Structure

```
xtreamplayer/
├── package.json          # Root with scripts
├── server/
│   ├── index.js          # Express app entry
│   ├── routes/
│   │   ├── playlists.js  # Playlist CRUD
│   │   ├── live.js       # Live TV endpoints
│   │   ├── vod.js        # VOD endpoints
│   │   ├── series.js     # Series endpoints
│   │   ├── epg.js        # EPG endpoints
│   │   ├── proxy.js      # Stream proxy
│   │   ├── search.js     # Search endpoint
│   │   ├── favorites.js  # Favorites endpoints
│   │   └── settings.js   # Settings endpoints
│   ├── services/
│   │   ├── playlist-parser.js   # M3U parsing
│   │   ├── xtream-client.js     # Xtream Codes API
│   │   ├── epg-engine.js        # XMLTV fetch/parse
│   │   └── store.js             # JSON file persistence
│   └── data/             # JSON storage files
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Layout/          # Nav, sidebar
│   │   │   ├── Player/          # Video player overlay
│   │   │   ├── ChannelCard/     # Channel tile
│   │   │   ├── MovieCard/       # Movie poster card
│   │   │   ├── SeriesCard/      # Series poster card
│   │   │   ├── EPGGrid/         # Program guide grid
│   │   │   ├── CategorySidebar/ # Category filter
│   │   │   └── Search/          # Search bar + results
│   │   ├── pages/
│   │   │   ├── Setup.jsx
│   │   │   ├── LiveTV.jsx
│   │   │   ├── Movies.jsx
│   │   │   ├── Series.jsx
│   │   │   ├── EPG.jsx
│   │   │   ├── Favorites.jsx
│   │   │   └── Settings.jsx
│   │   ├── hooks/               # Custom React hooks
│   │   ├── api/                 # API client functions
│   │   └── styles/              # Global styles, variables
│   └── public/
│       └── favicon.svg
└── data/                 # Persisted JSON files
    ├── settings.json
    ├── favorites.json
    └── recents.json
```

### Out of Scope

- Recording/DVR
- Parental controls / PIN lock
- Multi-user accounts
- Cloud sync
- Picture-in-Picture
- Mobile-optimized UI (functional but not a priority)
- Chromecast/AirPlay casting
