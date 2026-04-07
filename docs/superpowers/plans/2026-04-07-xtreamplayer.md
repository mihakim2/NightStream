# XtreamPlayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally-run, browser-based IPTV player mimicking iboIPTV — supporting M3U playlists and Xtream Codes API, with live TV, VOD, series, EPG, favorites, and a polished dark-themed UI.

**Architecture:** Node.js/Express backend handles playlist parsing, Xtream Codes API calls, stream proxying, EPG fetching, and local JSON persistence. React 18 + Vite frontend with HLS.js video player. Backend runs on port 3000, Vite dev server on port 5173 with proxy to backend.

**Tech Stack:** Node.js 18+, Express, React 18, Vite, HLS.js, xml2js, CSS Modules, concurrently

---

## File Structure

```
xtreamplayer/
├── package.json                          # Root: scripts, concurrently dep
├── server/
│   ├── index.js                          # Express entry, mounts routes, serves static in prod
│   ├── routes/
│   │   ├── playlists.js                  # CRUD for playlist configs
│   │   ├── live.js                       # Live categories + channels
│   │   ├── vod.js                        # VOD categories + movies
│   │   ├── series.js                     # Series categories + details
│   │   ├── epg.js                        # EPG per-channel + grid
│   │   ├── proxy.js                      # Stream proxy with HLS rewrite
│   │   ├── search.js                     # Global search
│   │   ├── favorites.js                  # Favorites CRUD
│   │   └── settings.js                   # Settings CRUD
│   └── services/
│       ├── store.js                      # JSON file read/write with defaults
│       ├── playlist-parser.js            # M3U URL fetch + parse
│       ├── xtream-client.js              # Xtream Codes API wrapper
│       ├── epg-engine.js                 # XMLTV fetch, parse, cache
│       └── playlist-manager.js           # Orchestrates parser + xtream, caches data
├── client/
│   ├── index.html                        # Vite HTML entry
│   ├── vite.config.js                    # Vite config with API proxy
│   └── src/
│       ├── main.jsx                      # React root mount
│       ├── App.jsx                       # Router + Layout wrapper
│       ├── api/
│       │   └── client.js                 # Fetch wrapper for all API calls
│       ├── hooks/
│       │   ├── useApi.js                 # Generic data-fetching hook
│       │   └── usePlayer.js              # Player state management hook
│       ├── styles/
│       │   ├── global.css                # CSS reset, variables, base styles
│       │   └── animations.css            # Keyframes for fade-in, skeleton
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── Layout.jsx            # Top nav + content area
│       │   │   └── Layout.module.css
│       │   ├── Player/
│       │   │   ├── Player.jsx            # Video player overlay
│       │   │   └── Player.module.css
│       │   ├── ChannelCard/
│       │   │   ├── ChannelCard.jsx       # Channel tile with EPG info
│       │   │   └── ChannelCard.module.css
│       │   ├── ContentCard/
│       │   │   ├── ContentCard.jsx       # Reusable poster card (movies/series)
│       │   │   └── ContentCard.module.css
│       │   ├── CategorySidebar/
│       │   │   ├── CategorySidebar.jsx   # Left sidebar category list
│       │   │   └── CategorySidebar.module.css
│       │   ├── EPGGrid/
│       │   │   ├── EPGGrid.jsx           # Program guide grid
│       │   │   └── EPGGrid.module.css
│       │   ├── ContentModal/
│       │   │   ├── ContentModal.jsx      # Detail modal for movies/episodes
│       │   │   └── ContentModal.module.css
│       │   ├── Search/
│       │   │   ├── SearchBar.jsx         # Search input in nav
│       │   │   ├── SearchResults.jsx     # Grouped search results
│       │   │   └── Search.module.css
│       │   └── Skeleton/
│       │       ├── Skeleton.jsx          # Loading skeleton component
│       │       └── Skeleton.module.css
│       └── pages/
│           ├── Setup.jsx                 # Playlist onboarding
│           ├── Setup.module.css
│           ├── LiveTV.jsx                # Live TV view
│           ├── LiveTV.module.css
│           ├── Movies.jsx                # VOD view
│           ├── Movies.module.css
│           ├── Series.jsx                # Series browse view
│           ├── Series.module.css
│           ├── SeriesDetail.jsx          # Single series with seasons/episodes
│           ├── SeriesDetail.module.css
│           ├── EPG.jsx                   # EPG page
│           ├── EPG.module.css
│           ├── Favorites.jsx             # Favorites page
│           ├── Favorites.module.css
│           ├── Settings.jsx              # Settings page
│           └── Settings.module.css
└── data/                                 # Created at runtime
    ├── settings.json
    ├── favorites.json
    └── recents.json
```

---

### Task 1: Project Scaffolding & Dev Tooling

**Files:**
- Create: `package.json`
- Create: `server/index.js`
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/styles/global.css`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/moazamhakim/CodingProjects/xtreamplayer
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "xtreamplayer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "cd client && npx vite --host",
    "build": "cd client && npx vite build",
    "start": "npm run dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^3.3.2",
    "xml2js": "^0.6.2",
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
client/node_modules/
dist/
data/*.json
.DS_Store
```

- [ ] **Step 4: Create server entry**

Create `server/index.js`:

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`XtreamPlayer server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 5: Create client scaffolding**

Create `client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>XtreamPlayer</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

Create `client/vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Create `client/src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `client/src/App.jsx`:

```jsx
import React from 'react';

export default function App() {
  return (
    <div style={{ color: '#e8e8f0', background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>XtreamPlayer</h1>
    </div>
  );
}
```

- [ ] **Step 6: Create global CSS with theme variables**

Create `client/src/styles/global.css`:

```css
:root {
  --bg: #0a0a0f;
  --surface: #141420;
  --surface-hover: #1c1c30;
  --text-primary: #e8e8f0;
  --text-secondary: #8888a0;
  --accent: #4f8eff;
  --accent-hover: #6ba0ff;
  --danger: #ff4f6a;
  --success: #4fff8e;
  --radius-sm: 8px;
  --radius-md: 12px;
  --glass-bg: rgba(20, 20, 32, 0.8);
  --glass-blur: blur(20px);
  --transition-fast: 200ms ease;
  --transition-normal: 300ms ease;
  --font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

a {
  color: var(--accent);
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

input, select {
  font-family: inherit;
  color: inherit;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-fast);
}

input:focus, select:focus {
  border-color: var(--accent);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
```

- [ ] **Step 7: Create client package.json and install deps**

```bash
cd /Users/moazamhakim/CodingProjects/xtreamplayer/client
npm init -y
npm install react react-dom react-router-dom hls.js
npm install -D vite @vitejs/plugin-react
cd /Users/moazamhakim/CodingProjects/xtreamplayer
npm install
```

- [ ] **Step 8: Verify both servers start**

```bash
cd /Users/moazamhakim/CodingProjects/xtreamplayer
npm run dev
```

Expected: Server logs "running on http://localhost:3000", Vite shows "Local: http://localhost:5173". Browser at localhost:5173 shows "XtreamPlayer" heading on dark background.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with Express backend and React/Vite frontend"
```

---

### Task 2: JSON Store & Settings Service

**Files:**
- Create: `server/services/store.js`
- Create: `server/routes/settings.js`
- Modify: `server/index.js` (mount settings routes)

- [ ] **Step 1: Create the JSON store service**

Create `server/services/store.js`:

```javascript
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readStore(filename, defaultValue = {}) {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  try {
    const raw = await readFile(filepath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export async function writeStore(filename, data) {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}
```

- [ ] **Step 2: Create settings routes**

Create `server/routes/settings.js`:

```javascript
import { Router } from 'express';
import { readStore, writeStore } from '../services/store.js';

const router = Router();

const DEFAULT_SETTINGS = {
  activePlaylistId: null,
  epgUrl: '',
  playerDefaults: {
    audioLanguage: '',
    subtitleLanguage: '',
    aspectRatio: 'fit',
  },
};

router.get('/', async (req, res) => {
  const settings = await readStore('settings.json', DEFAULT_SETTINGS);
  res.json(settings);
});

router.put('/', async (req, res) => {
  const current = await readStore('settings.json', DEFAULT_SETTINGS);
  const updated = { ...current, ...req.body };
  await writeStore('settings.json', updated);
  res.json(updated);
});

export default router;
```

- [ ] **Step 3: Mount settings routes in server/index.js**

Add to `server/index.js` after the health check, before `app.listen`:

```javascript
import settingsRoutes from './routes/settings.js';

app.use('/api/settings', settingsRoutes);
```

- [ ] **Step 4: Verify settings endpoints work**

```bash
curl http://localhost:3000/api/settings
# Expected: {"activePlaylistId":null,"epgUrl":"","playerDefaults":{"audioLanguage":"","subtitleLanguage":"","aspectRatio":"fit"}}

curl -X PUT http://localhost:3000/api/settings -H "Content-Type: application/json" -d '{"epgUrl":"http://example.com/epg.xml"}'
# Expected: updated settings with epgUrl set
```

- [ ] **Step 5: Commit**

```bash
git add server/services/store.js server/routes/settings.js server/index.js
git commit -m "feat: add JSON store service and settings API"
```

---

### Task 3: M3U Playlist Parser

**Files:**
- Create: `server/services/playlist-parser.js`

- [ ] **Step 1: Create the M3U parser**

Create `server/services/playlist-parser.js`:

```javascript
import fetch from 'node-fetch';

/**
 * Parses an M3U playlist URL into structured channel/VOD data.
 * Handles #EXTINF lines with attributes: tvg-id, tvg-name, tvg-logo, group-title
 */
export async function parseM3U(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch M3U: ${response.status}`);
  const text = await response.text();
  return parseM3UText(text);
}

export function parseM3UText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      current = parseExtInf(line);
    } else if (current && !line.startsWith('#')) {
      current.url = line;
      current.type = guessType(current);
      items.push(current);
      current = null;
    }
  }

  return items;
}

function parseExtInf(line) {
  const item = {
    name: '',
    logo: '',
    group: 'Uncategorized',
    tvgId: '',
    tvgName: '',
    url: '',
    type: 'live',
  };

  // Extract attributes from the tag
  const tvgId = line.match(/tvg-id="([^"]*)"/);
  const tvgName = line.match(/tvg-name="([^"]*)"/);
  const tvgLogo = line.match(/tvg-logo="([^"]*)"/);
  const groupTitle = line.match(/group-title="([^"]*)"/);

  if (tvgId) item.tvgId = tvgId[1];
  if (tvgName) item.tvgName = tvgName[1];
  if (tvgLogo) item.logo = tvgLogo[1];
  if (groupTitle) item.group = groupTitle[1] || 'Uncategorized';

  // Name is after the last comma
  const commaIdx = line.lastIndexOf(',');
  if (commaIdx !== -1) {
    item.name = line.substring(commaIdx + 1).trim();
  }

  return item;
}

function guessType(item) {
  const group = item.group.toLowerCase();
  const url = item.url.toLowerCase();
  if (group.includes('vod') || group.includes('movie') || url.endsWith('.mp4') || url.endsWith('.mkv')) {
    return 'vod';
  }
  if (group.includes('series') || group.includes('episode')) {
    return 'series';
  }
  return 'live';
}
```

- [ ] **Step 2: Quick test via node REPL**

```bash
cd /Users/moazamhakim/CodingProjects/xtreamplayer
node -e "
import { parseM3UText } from './server/services/playlist-parser.js';
const sample = '#EXTM3U\n#EXTINF:-1 tvg-id=\"ch1\" tvg-name=\"Test\" tvg-logo=\"http://logo.png\" group-title=\"News\",Test Channel\nhttp://stream.example.com/live/1\n#EXTINF:-1 tvg-id=\"m1\" group-title=\"VOD Movies\",Test Movie\nhttp://stream.example.com/movie/1.mp4';
const result = parseM3UText(sample);
console.log(JSON.stringify(result, null, 2));
"
```

Expected: Array with 2 items — one live channel (group "News"), one VOD (group "VOD Movies").

- [ ] **Step 3: Commit**

```bash
git add server/services/playlist-parser.js
git commit -m "feat: add M3U playlist parser with attribute extraction"
```

---

### Task 4: Xtream Codes API Client

**Files:**
- Create: `server/services/xtream-client.js`

- [ ] **Step 1: Create the Xtream Codes API client**

Create `server/services/xtream-client.js`:

```javascript
import fetch from 'node-fetch';

/**
 * Client for the Xtream Codes API.
 * Base URL format: http://server:port/player_api.php?username=X&password=Y
 */
export class XtreamClient {
  constructor(server, username, password) {
    // Normalize server URL — strip trailing slash, ensure no path
    this.server = server.replace(/\/+$/, '');
    this.username = username;
    this.password = password;
    this.baseUrl = `${this.server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  }

  async _get(params = '') {
    const url = `${this.baseUrl}${params ? '&' + params : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Xtream API error: ${res.status}`);
    return res.json();
  }

  /** Authenticate and get server info */
  async getAccountInfo() {
    return this._get();
  }

  /** Live TV categories */
  async getLiveCategories() {
    return this._get('action=get_live_categories');
  }

  /** Live TV streams, optionally filtered by category */
  async getLiveStreams(categoryId) {
    const param = categoryId ? `action=get_live_streams&category_id=${categoryId}` : 'action=get_live_streams';
    return this._get(param);
  }

  /** VOD categories */
  async getVodCategories() {
    return this._get('action=get_vod_categories');
  }

  /** VOD streams, optionally filtered */
  async getVodStreams(categoryId) {
    const param = categoryId ? `action=get_vod_streams&category_id=${categoryId}` : 'action=get_vod_streams';
    return this._get(param);
  }

  /** Series categories */
  async getSeriesCategories() {
    return this._get('action=get_series_categories');
  }

  /** Series list, optionally filtered */
  async getSeries(categoryId) {
    const param = categoryId ? `action=get_series&category_id=${categoryId}` : 'action=get_series';
    return this._get(param);
  }

  /** Series info (seasons + episodes) */
  async getSeriesInfo(seriesId) {
    return this._get(`action=get_series_info&series_id=${seriesId}`);
  }

  /** EPG for a specific stream */
  async getEpg(streamId) {
    return this._get(`action=get_short_epg&stream_id=${streamId}`);
  }

  /** Full EPG (all channels) */
  async getFullEpg() {
    return this._get('action=get_simple_data_table&stream_id=all');
  }

  /** Build a live stream URL */
  getLiveStreamUrl(streamId, extension = 'm3u8') {
    return `${this.server}/live/${encodeURIComponent(this.username)}/${encodeURIComponent(this.password)}/${streamId}.${extension}`;
  }

  /** Build a VOD stream URL */
  getVodStreamUrl(streamId, extension = 'mp4') {
    return `${this.server}/movie/${encodeURIComponent(this.username)}/${encodeURIComponent(this.password)}/${streamId}.${extension}`;
  }

  /** Build a series episode stream URL */
  getSeriesStreamUrl(streamId, extension = 'mp4') {
    return `${this.server}/series/${encodeURIComponent(this.username)}/${encodeURIComponent(this.password)}/${streamId}.${extension}`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/xtream-client.js
git commit -m "feat: add Xtream Codes API client with full endpoint coverage"
```

---

### Task 5: Playlist Manager (Orchestrator)

**Files:**
- Create: `server/services/playlist-manager.js`
- Create: `server/routes/playlists.js`
- Create: `server/routes/live.js`
- Create: `server/routes/vod.js`
- Create: `server/routes/series.js`
- Modify: `server/index.js` (mount new routes)

- [ ] **Step 1: Create playlist manager service**

Create `server/services/playlist-manager.js`:

```javascript
import { readStore, writeStore } from './store.js';
import { parseM3U } from './playlist-parser.js';
import { XtreamClient } from './xtream-client.js';
import crypto from 'crypto';

// In-memory cache of parsed playlist data
const cache = {
  playlists: {},  // playlistId -> { live: [], vod: [], series: [], liveCategories: [], vodCategories: [], seriesCategories: [] }
  clients: {},    // playlistId -> XtreamClient instance (for XC type)
};

export async function getPlaylists() {
  const data = await readStore('playlists.json', { playlists: [] });
  return data.playlists;
}

export async function addPlaylist(config) {
  const data = await readStore('playlists.json', { playlists: [] });
  const playlist = {
    id: crypto.randomUUID(),
    name: config.name || 'My Playlist',
    type: config.type, // 'm3u' or 'xtream'
    // M3U fields
    url: config.url || '',
    // Xtream fields
    server: config.server || '',
    username: config.username || '',
    password: config.password || '',
    createdAt: Date.now(),
  };
  data.playlists.push(playlist);
  await writeStore('playlists.json', data);

  // Set as active if first playlist
  const settings = await readStore('settings.json', {});
  if (!settings.activePlaylistId) {
    settings.activePlaylistId = playlist.id;
    await writeStore('settings.json', settings);
  }

  return playlist;
}

export async function removePlaylist(id) {
  const data = await readStore('playlists.json', { playlists: [] });
  data.playlists = data.playlists.filter(p => p.id !== id);
  await writeStore('playlists.json', data);
  delete cache.playlists[id];
  delete cache.clients[id];
}

export async function getActivePlaylist() {
  const settings = await readStore('settings.json', {});
  const data = await readStore('playlists.json', { playlists: [] });
  const id = settings.activePlaylistId;
  return data.playlists.find(p => p.id === id) || data.playlists[0] || null;
}

export async function loadPlaylistData(playlist) {
  if (!playlist) return null;
  if (cache.playlists[playlist.id]) return cache.playlists[playlist.id];

  let data;
  if (playlist.type === 'xtream') {
    data = await loadXtreamData(playlist);
  } else {
    data = await loadM3UData(playlist);
  }

  cache.playlists[playlist.id] = data;
  return data;
}

async function loadXtreamData(playlist) {
  const client = new XtreamClient(playlist.server, playlist.username, playlist.password);
  cache.clients[playlist.id] = client;

  const [liveCategories, vodCategories, seriesCategories, liveStreams, vodStreams, seriesList] = await Promise.all([
    client.getLiveCategories().catch(() => []),
    client.getVodCategories().catch(() => []),
    client.getSeriesCategories().catch(() => []),
    client.getLiveStreams().catch(() => []),
    client.getVodStreams().catch(() => []),
    client.getSeries().catch(() => []),
  ]);

  return {
    type: 'xtream',
    liveCategories: Array.isArray(liveCategories) ? liveCategories.map(c => ({ id: c.category_id, name: c.category_name })) : [],
    vodCategories: Array.isArray(vodCategories) ? vodCategories.map(c => ({ id: c.category_id, name: c.category_name })) : [],
    seriesCategories: Array.isArray(seriesCategories) ? seriesCategories.map(c => ({ id: c.category_id, name: c.category_name })) : [],
    live: Array.isArray(liveStreams) ? liveStreams.map(s => ({
      id: s.stream_id,
      name: s.name,
      logo: s.stream_icon || '',
      group: s.category_id,
      url: client.getLiveStreamUrl(s.stream_id),
      epgChannelId: s.epg_channel_id || '',
    })) : [],
    vod: Array.isArray(vodStreams) ? vodStreams.map(s => ({
      id: s.stream_id,
      name: s.name,
      logo: s.stream_icon || '',
      group: s.category_id,
      url: client.getVodStreamUrl(s.stream_id),
      rating: s.rating || '',
      plot: s.plot || '',
      year: s.year || '',
      duration: s.container_extension || '',
    })) : [],
    series: Array.isArray(seriesList) ? seriesList.map(s => ({
      id: s.series_id,
      name: s.name,
      logo: s.cover || '',
      group: s.category_id,
      plot: s.plot || '',
      rating: s.rating || '',
      year: s.year || '',
    })) : [],
  };
}

async function loadM3UData(playlist) {
  const items = await parseM3U(playlist.url);
  const liveItems = items.filter(i => i.type === 'live');
  const vodItems = items.filter(i => i.type === 'vod');
  const seriesItems = items.filter(i => i.type === 'series');

  const extractCategories = (items) => {
    const groups = [...new Set(items.map(i => i.group))];
    return groups.map((g, idx) => ({ id: String(idx), name: g }));
  };

  return {
    type: 'm3u',
    liveCategories: extractCategories(liveItems),
    vodCategories: extractCategories(vodItems),
    seriesCategories: extractCategories(seriesItems),
    live: liveItems.map((item, idx) => ({
      id: String(idx),
      name: item.name,
      logo: item.logo,
      group: item.group,
      url: item.url,
      epgChannelId: item.tvgId,
    })),
    vod: vodItems.map((item, idx) => ({
      id: String(idx),
      name: item.name,
      logo: item.logo,
      group: item.group,
      url: item.url,
    })),
    series: seriesItems.map((item, idx) => ({
      id: String(idx),
      name: item.name,
      logo: item.logo,
      group: item.group,
      url: item.url,
    })),
  };
}

export function getXtreamClient(playlistId) {
  return cache.clients[playlistId] || null;
}

export function clearCache(playlistId) {
  if (playlistId) {
    delete cache.playlists[playlistId];
    delete cache.clients[playlistId];
  } else {
    Object.keys(cache.playlists).forEach(k => delete cache.playlists[k]);
    Object.keys(cache.clients).forEach(k => delete cache.clients[k]);
  }
}
```

- [ ] **Step 2: Create playlist routes**

Create `server/routes/playlists.js`:

```javascript
import { Router } from 'express';
import { getPlaylists, addPlaylist, removePlaylist, getActivePlaylist, loadPlaylistData, clearCache } from '../services/playlist-manager.js';
import { XtreamClient } from '../services/xtream-client.js';
import { readStore, writeStore } from '../services/store.js';

const router = Router();

router.get('/', async (req, res) => {
  const playlists = await getPlaylists();
  const settings = await readStore('settings.json', {});
  res.json({ playlists, activePlaylistId: settings.activePlaylistId || null });
});

router.post('/', async (req, res) => {
  try {
    const playlist = await addPlaylist(req.body);
    // Preload data
    await loadPlaylistData(playlist);
    res.json(playlist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await removePlaylist(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/activate', async (req, res) => {
  const settings = await readStore('settings.json', {});
  settings.activePlaylistId = req.params.id;
  await writeStore('settings.json', settings);
  clearCache();
  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  try {
    const { type, url, server, username, password } = req.body;
    if (type === 'xtream') {
      const client = new XtreamClient(server, username, password);
      const info = await client.getAccountInfo();
      res.json({ ok: true, info });
    } else {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const hasExtM3U = text.includes('#EXTM3U') || text.includes('#EXTINF');
      res.json({ ok: hasExtM3U, lines: text.split('\n').length });
    }
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

export default router;
```

- [ ] **Step 3: Create live TV routes**

Create `server/routes/live.js`:

```javascript
import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData } from '../services/playlist-manager.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  res.json(data.liveCategories);
});

router.get('/channels', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  let channels = data.live;
  const { category } = req.query;
  if (category) {
    channels = channels.filter(c => String(c.group) === String(category));
  }
  res.json(channels);
});

export default router;
```

- [ ] **Step 4: Create VOD routes**

Create `server/routes/vod.js`:

```javascript
import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData } from '../services/playlist-manager.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  res.json(data.vodCategories);
});

router.get('/movies', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  let movies = data.vod;
  const { category } = req.query;
  if (category) {
    movies = movies.filter(m => String(m.group) === String(category));
  }
  res.json(movies);
});

export default router;
```

- [ ] **Step 5: Create series routes**

Create `server/routes/series.js`:

```javascript
import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData, getXtreamClient } from '../services/playlist-manager.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  res.json(data.seriesCategories);
});

router.get('/', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  let series = data.series;
  const { category } = req.query;
  if (category) {
    series = series.filter(s => String(s.group) === String(category));
  }
  res.json(series);
});

router.get('/:id', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json(null);

  if (playlist.type === 'xtream') {
    const client = getXtreamClient(playlist.id);
    if (!client) return res.status(400).json({ error: 'Playlist not loaded' });
    try {
      const info = await client.getSeriesInfo(req.params.id);
      const seasons = {};
      if (info.episodes) {
        for (const [seasonNum, episodes] of Object.entries(info.episodes)) {
          seasons[seasonNum] = episodes.map(ep => ({
            id: ep.id,
            episodeNum: ep.episode_num,
            title: ep.title || `Episode ${ep.episode_num}`,
            plot: ep.plot || '',
            duration: ep.duration || '',
            logo: ep.info?.movie_image || '',
            url: client.getSeriesStreamUrl(ep.id, ep.container_extension || 'mp4'),
          }));
        }
      }
      res.json({
        id: info.info?.series_id || req.params.id,
        name: info.info?.name || '',
        logo: info.info?.cover || '',
        plot: info.info?.plot || '',
        year: info.info?.year || '',
        rating: info.info?.rating || '',
        seasons,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    // M3U playlists don't have series detail
    const data = await loadPlaylistData(playlist);
    const item = data.series.find(s => String(s.id) === req.params.id);
    res.json(item || null);
  }
});

export default router;
```

- [ ] **Step 6: Mount all new routes in server/index.js**

Replace `server/index.js` with:

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import settingsRoutes from './routes/settings.js';
import playlistRoutes from './routes/playlists.js';
import liveRoutes from './routes/live.js';
import vodRoutes from './routes/vod.js';
import seriesRoutes from './routes/series.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/settings', settingsRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/vod', vodRoutes);
app.use('/api/series', seriesRoutes);

app.listen(PORT, () => {
  console.log(`XtreamPlayer server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 7: Verify server starts without errors**

```bash
cd /Users/moazamhakim/CodingProjects/xtreamplayer
node server/index.js
# Expected: "XtreamPlayer server running on http://localhost:3000" with no import errors
```

- [ ] **Step 8: Commit**

```bash
git add server/
git commit -m "feat: add playlist manager, Xtream client, and live/VOD/series routes"
```

---

### Task 6: Stream Proxy

**Files:**
- Create: `server/routes/proxy.js`
- Modify: `server/index.js` (mount proxy route)

- [ ] **Step 1: Create stream proxy route**

Create `server/routes/proxy.js`:

```javascript
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || '';

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');

    // If this is an HLS manifest, rewrite segment URLs to go through proxy
    if (contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8')) {
      const body = await response.text();
      const rewritten = rewriteHlsManifest(body, targetUrl);
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    // Otherwise, pipe the stream directly
    res.set('Content-Type', contentType || 'application/octet-stream');
    response.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function rewriteHlsManifest(manifest, manifestUrl) {
  const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);

  return manifest.split('\n').map(line => {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      // But rewrite URI= references inside EXT tags (e.g., EXT-X-KEY, EXT-X-MAP)
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
          const absoluteUri = uri.startsWith('http') ? uri : baseUrl + uri;
          return `URI="/api/proxy/stream?url=${encodeURIComponent(absoluteUri)}"`;
        });
      }
      return line;
    }
    // Rewrite relative URLs to absolute, then wrap in proxy
    const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
    return `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
  }).join('\n');
}

export default router;
```

- [ ] **Step 2: Mount proxy in server/index.js**

Add import and mount line:

```javascript
import proxyRoutes from './routes/proxy.js';

app.use('/api/proxy', proxyRoutes);
```

- [ ] **Step 3: Verify proxy works with a public HLS stream**

```bash
curl -s "http://localhost:3000/api/proxy/stream?url=https%3A%2F%2Ftest-streams.mux.dev%2Fx36xhzz%2Fx36xhzz.m3u8" | head -5
# Expected: HLS manifest with segment URLs rewritten to /api/proxy/stream?url=...
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/proxy.js server/index.js
git commit -m "feat: add stream proxy with HLS manifest rewriting"
```

---

### Task 7: EPG Engine

**Files:**
- Create: `server/services/epg-engine.js`
- Create: `server/routes/epg.js`
- Modify: `server/index.js` (mount EPG route)

- [ ] **Step 1: Create EPG engine service**

Create `server/services/epg-engine.js`:

```javascript
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { readStore, writeStore } from './store.js';

let epgCache = null;
let lastFetch = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export async function fetchAndParseEpg(url) {
  if (!url) return {};

  const now = Date.now();
  if (epgCache && (now - lastFetch) < CACHE_DURATION) {
    return epgCache;
  }

  // Try loading from disk cache first
  const diskCache = await readStore('epg-cache.json', { data: null, fetchedAt: 0 });
  if (diskCache.data && (now - diskCache.fetchedAt) < CACHE_DURATION) {
    epgCache = diskCache.data;
    lastFetch = diskCache.fetchedAt;
    return epgCache;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`EPG fetch failed: ${response.status}`);
    const xml = await response.text();
    const parsed = await parseXmltvToSchedule(xml);
    epgCache = parsed;
    lastFetch = now;

    // Cache to disk
    await writeStore('epg-cache.json', { data: parsed, fetchedAt: now });

    return parsed;
  } catch (err) {
    console.error('EPG fetch error:', err.message);
    return epgCache || {};
  }
}

async function parseXmltvToSchedule(xml) {
  const result = await parseStringPromise(xml, { explicitArray: false });
  const tv = result.tv;
  if (!tv || !tv.programme) return {};

  const programmes = Array.isArray(tv.programme) ? tv.programme : [tv.programme];
  const schedule = {};

  for (const prog of programmes) {
    const channelId = prog.$.channel;
    if (!schedule[channelId]) schedule[channelId] = [];

    schedule[channelId].push({
      title: extractText(prog.title),
      description: extractText(prog.desc),
      start: parseXmltvDate(prog.$.start),
      stop: parseXmltvDate(prog.$.stop),
      category: extractText(prog.category),
    });
  }

  // Sort each channel's programs by start time
  for (const channelId of Object.keys(schedule)) {
    schedule[channelId].sort((a, b) => a.start - b.start);
  }

  return schedule;
}

function extractText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (field._) return field._;
  if (Array.isArray(field)) return extractText(field[0]);
  return '';
}

function parseXmltvDate(str) {
  if (!str) return 0;
  // XMLTV format: 20260407120000 +0000
  const clean = str.replace(/\s.*$/, ''); // strip timezone for simplicity
  const y = clean.substring(0, 4);
  const m = clean.substring(4, 6);
  const d = clean.substring(6, 8);
  const h = clean.substring(8, 10);
  const min = clean.substring(10, 12);
  const s = clean.substring(12, 14);
  return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).getTime();
}

export function getCurrentProgram(programs) {
  if (!programs || !programs.length) return null;
  const now = Date.now();
  return programs.find(p => p.start <= now && p.stop > now) || null;
}

export function getNextProgram(programs) {
  if (!programs || !programs.length) return null;
  const now = Date.now();
  return programs.find(p => p.start > now) || null;
}
```

- [ ] **Step 2: Create EPG routes**

Create `server/routes/epg.js`:

```javascript
import { Router } from 'express';
import { fetchAndParseEpg, getCurrentProgram, getNextProgram } from '../services/epg-engine.js';
import { readStore } from '../services/store.js';
import { getActivePlaylist, getXtreamClient } from '../services/playlist-manager.js';

const router = Router();

async function getEpgUrl() {
  const settings = await readStore('settings.json', {});
  if (settings.epgUrl) return settings.epgUrl;

  // For Xtream playlists, try using the XC EPG URL
  const playlist = await getActivePlaylist();
  if (playlist && playlist.type === 'xtream') {
    return `${playlist.server}/xmltv.php?username=${encodeURIComponent(playlist.username)}&password=${encodeURIComponent(playlist.password)}`;
  }
  return null;
}

router.get('/grid', async (req, res) => {
  const epgUrl = await getEpgUrl();
  const schedule = await fetchAndParseEpg(epgUrl);
  res.json(schedule);
});

router.get('/:channelId', async (req, res) => {
  const epgUrl = await getEpgUrl();
  const schedule = await fetchAndParseEpg(epgUrl);
  const programs = schedule[req.params.channelId] || [];
  const current = getCurrentProgram(programs);
  const next = getNextProgram(programs);
  res.json({ programs, current, next });
});

export default router;
```

- [ ] **Step 3: Mount EPG routes in server/index.js**

Add import and mount:

```javascript
import epgRoutes from './routes/epg.js';

app.use('/api/epg', epgRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/services/epg-engine.js server/routes/epg.js server/index.js
git commit -m "feat: add EPG engine with XMLTV parsing and 12-hour cache"
```

---

### Task 8: Search & Favorites Routes

**Files:**
- Create: `server/routes/search.js`
- Create: `server/routes/favorites.js`
- Modify: `server/index.js` (mount routes)

- [ ] **Step 1: Create search route**

Create `server/routes/search.js`:

```javascript
import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData } from '../services/playlist-manager.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ live: [], vod: [], series: [] });

  const playlist = await getActivePlaylist();
  if (!playlist) return res.json({ live: [], vod: [], series: [] });

  const data = await loadPlaylistData(playlist);
  const query = q.toLowerCase();

  res.json({
    live: data.live.filter(c => c.name.toLowerCase().includes(query)).slice(0, 50),
    vod: data.vod.filter(m => m.name.toLowerCase().includes(query)).slice(0, 50),
    series: data.series.filter(s => s.name.toLowerCase().includes(query)).slice(0, 50),
  });
});

export default router;
```

- [ ] **Step 2: Create favorites route**

Create `server/routes/favorites.js`:

```javascript
import { Router } from 'express';
import { readStore, writeStore } from '../services/store.js';
import { getActivePlaylist } from '../services/playlist-manager.js';

const router = Router();

async function getFavoritesForPlaylist() {
  const playlist = await getActivePlaylist();
  const playlistId = playlist?.id || 'default';
  const allFavs = await readStore('favorites.json', {});
  return { playlistId, favorites: allFavs[playlistId] || { live: [], vod: [], series: [] } };
}

router.get('/', async (req, res) => {
  const { favorites } = await getFavoritesForPlaylist();
  res.json(favorites);
});

router.post('/', async (req, res) => {
  const { type, id } = req.body; // type: 'live' | 'vod' | 'series'
  if (!type || !id) return res.status(400).json({ error: 'type and id required' });

  const { playlistId, favorites } = await getFavoritesForPlaylist();
  if (!favorites[type]) favorites[type] = [];

  const idx = favorites[type].indexOf(String(id));
  if (idx === -1) {
    favorites[type].push(String(id));
  } else {
    favorites[type].splice(idx, 1);
  }

  const allFavs = await readStore('favorites.json', {});
  allFavs[playlistId] = favorites;
  await writeStore('favorites.json', allFavs);

  res.json(favorites);
});

export default router;
```

- [ ] **Step 3: Mount search and favorites in server/index.js**

Add imports and mounts:

```javascript
import searchRoutes from './routes/search.js';
import favoritesRoutes from './routes/favorites.js';

app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoritesRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/search.js server/routes/favorites.js server/index.js
git commit -m "feat: add search and favorites API endpoints"
```

---

### Task 9: Frontend API Client & Hooks

**Files:**
- Create: `client/src/api/client.js`
- Create: `client/src/hooks/useApi.js`
- Create: `client/src/hooks/usePlayer.js`
- Create: `client/src/styles/animations.css`

- [ ] **Step 1: Create API client**

Create `client/src/api/client.js`:

```javascript
const BASE = '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Playlists
export const getPlaylists = () => request('/api/playlists');
export const addPlaylist = (data) => request('/api/playlists', { method: 'POST', body: JSON.stringify(data) });
export const removePlaylist = (id) => request(`/api/playlists/${id}`, { method: 'DELETE' });
export const activatePlaylist = (id) => request(`/api/playlists/${id}/activate`, { method: 'POST' });
export const testPlaylist = (data) => request('/api/playlists/test', { method: 'POST', body: JSON.stringify(data) });

// Live
export const getLiveCategories = () => request('/api/live/categories');
export const getLiveChannels = (category) => request(`/api/live/channels${category ? `?category=${category}` : ''}`);

// VOD
export const getVodCategories = () => request('/api/vod/categories');
export const getVodMovies = (category) => request(`/api/vod/movies${category ? `?category=${category}` : ''}`);

// Series
export const getSeriesCategories = () => request('/api/series/categories');
export const getSeriesList = (category) => request(`/api/series${category ? `?category=${category}` : ''}`);
export const getSeriesDetail = (id) => request(`/api/series/${id}`);

// EPG
export const getEpgForChannel = (channelId) => request(`/api/epg/${channelId}`);
export const getEpgGrid = () => request('/api/epg/grid');

// Search
export const searchAll = (q) => request(`/api/search?q=${encodeURIComponent(q)}`);

// Favorites
export const getFavorites = () => request('/api/favorites');
export const toggleFavorite = (type, id) => request('/api/favorites', { method: 'POST', body: JSON.stringify({ type, id }) });

// Settings
export const getSettings = () => request('/api/settings');
export const updateSettings = (data) => request('/api/settings', { method: 'PUT', body: JSON.stringify(data) });

// Stream proxy URL builder
export const proxyUrl = (url) => `/api/proxy/stream?url=${encodeURIComponent(url)}`;
```

- [ ] **Step 2: Create useApi hook**

Create `client/src/hooks/useApi.js`:

```jsx
import { useState, useEffect, useCallback } from 'react';

export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
```

- [ ] **Step 3: Create usePlayer hook**

Create `client/src/hooks/usePlayer.js`:

```jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { proxyUrl } from '../api/client.js';

export function usePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const play = useCallback((item) => {
    setCurrentItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setIsOpen(false);
    setCurrentItem(null);
  }, []);

  const attachVideo = useCallback((videoElement) => {
    videoRef.current = videoElement;
    if (!videoElement || !currentItem) return;

    const streamUrl = proxyUrl(currentItem.url);

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentItem.url.includes('.m3u8') || currentItem.url.includes('/live/')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr, url) => {
            // HLS.js will use the proxy-rewritten URLs from our manifest
          },
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch(() => {});
        });
        hlsRef.current = hls;
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoElement.src = streamUrl;
        videoElement.play().catch(() => {});
      }
    } else {
      // Direct video (MP4, etc.)
      videoElement.src = streamUrl;
      videoElement.play().catch(() => {});
    }
  }, [currentItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  return {
    isOpen,
    currentItem,
    play,
    close,
    attachVideo,
    hlsRef,
    videoRef,
  };
}
```

- [ ] **Step 4: Create animations CSS**

Create `client/src/styles/animations.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.fade-in {
  animation: fadeIn var(--transition-normal) ease forwards;
}

.stagger-1 { animation-delay: 0.03s; }
.stagger-2 { animation-delay: 0.06s; }
.stagger-3 { animation-delay: 0.09s; }
.stagger-4 { animation-delay: 0.12s; }
.stagger-5 { animation-delay: 0.15s; }
```

- [ ] **Step 5: Import animations in global.css**

Add to top of `client/src/styles/global.css`:

```css
@import './animations.css';
```

- [ ] **Step 6: Commit**

```bash
git add client/src/api/ client/src/hooks/ client/src/styles/
git commit -m "feat: add API client, useApi/usePlayer hooks, and animation CSS"
```

---

### Task 10: Layout & Navigation Component

**Files:**
- Create: `client/src/components/Layout/Layout.jsx`
- Create: `client/src/components/Layout/Layout.module.css`
- Modify: `client/src/App.jsx` (add router + layout)

- [ ] **Step 1: Create Layout component**

Create `client/src/components/Layout/Layout.jsx`:

```jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { path: '/live', label: 'Live TV', icon: '📡' },
  { path: '/movies', label: 'Movies', icon: '🎬' },
  { path: '/series', label: 'Series', icon: '📺' },
  { path: '/epg', label: 'EPG', icon: '📋' },
  { path: '/favorites', label: 'Favorites', icon: '❤️' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.brand} onClick={() => navigate('/live')}>
          <span className={styles.logo}>▶</span>
          <span className={styles.brandName}>XtreamPlayer</span>
        </div>
        <div className={styles.navItems}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search... ( / )"
            className={styles.searchInput}
            onFocus={(e) => {
              navigate('/search');
            }}
          />
        </div>
      </nav>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create Layout CSS Module**

Create `client/src/components/Layout/Layout.module.css`:

```css
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  height: 64px;
  background: rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-right: 16px;
  flex-shrink: 0;
}

.logo {
  font-size: 20px;
  color: var(--accent);
}

.brandName {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.navItems {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
  position: relative;
}

.navItem:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.navItem.active {
  color: var(--accent);
  background: rgba(79, 142, 255, 0.1);
}

.navItem.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
}

.navIcon {
  font-size: 16px;
}

.navLabel {
  font-size: 13px;
}

.searchWrapper {
  flex-shrink: 0;
  margin-left: auto;
}

.searchInput {
  width: 220px;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  transition: all var(--transition-fast);
}

.searchInput:focus {
  width: 280px;
  border-color: var(--accent);
  background: var(--surface-hover);
}

.content {
  flex: 1;
  padding: 24px;
  max-width: 100%;
  overflow-x: hidden;
}
```

- [ ] **Step 3: Update App.jsx with router and layout**

Replace `client/src/App.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import { usePlayer } from './hooks/usePlayer.js';
import { getPlaylists } from './api/client.js';

// Lazy placeholder pages — will be replaced in later tasks
function Placeholder({ name }) {
  return <div style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{name} — coming soon</div>;
}

export const PlayerContext = React.createContext(null);

export default function App() {
  const player = usePlayer();
  const [hasPlaylist, setHasPlaylist] = useState(null);

  useEffect(() => {
    getPlaylists()
      .then(res => setHasPlaylist(res.playlists && res.playlists.length > 0))
      .catch(() => setHasPlaylist(false));
  }, []);

  if (hasPlaylist === null) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <PlayerContext.Provider value={player}>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<Placeholder name="Setup" />} />
          <Route path="/*" element={
            hasPlaylist ? (
              <Layout>
                <Routes>
                  <Route path="/live" element={<Placeholder name="Live TV" />} />
                  <Route path="/movies" element={<Placeholder name="Movies" />} />
                  <Route path="/series" element={<Placeholder name="Series" />} />
                  <Route path="/series/:id" element={<Placeholder name="Series Detail" />} />
                  <Route path="/epg" element={<Placeholder name="EPG" />} />
                  <Route path="/favorites" element={<Placeholder name="Favorites" />} />
                  <Route path="/search" element={<Placeholder name="Search" />} />
                  <Route path="/settings" element={<Placeholder name="Settings" />} />
                  <Route path="*" element={<Navigate to="/live" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/setup" replace />
            )
          } />
        </Routes>
      </BrowserRouter>
    </PlayerContext.Provider>
  );
}
```

- [ ] **Step 4: Verify navigation renders in browser**

```bash
npm run dev
# Open http://localhost:5173 — should show nav bar with all tabs, redirect to /setup since no playlists exist
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Layout/ client/src/App.jsx
git commit -m "feat: add Layout with navigation bar, router, and player context"
```

---

### Task 11: Setup / Playlist Onboarding Page

**Files:**
- Create: `client/src/pages/Setup.jsx`
- Create: `client/src/pages/Setup.module.css`
- Modify: `client/src/App.jsx` (wire real Setup page)

- [ ] **Step 1: Create Setup page**

Create `client/src/pages/Setup.jsx`:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPlaylist, testPlaylist } from '../api/client.js';
import styles from './Setup.module.css';

export default function Setup() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('xtream');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Xtream fields
  const [name, setName] = useState('');
  const [server, setServer] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // M3U fields
  const [m3uUrl, setM3uUrl] = useState('');

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setTestResult(null);
    try {
      const data = tab === 'xtream'
        ? { type: 'xtream', server, username, password }
        : { type: 'm3u', url: m3uUrl };
      const result = await testPlaylist(data);
      setTestResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = tab === 'xtream'
        ? { type: 'xtream', name: name || 'My IPTV', server, username, password }
        : { type: 'm3u', name: name || 'My Playlist', url: m3uUrl };
      await addPlaylist(data);
      navigate('/live');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>▶</span>
          <h1 className={styles.title}>XtreamPlayer</h1>
          <p className={styles.subtitle}>Add your playlist to get started</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'xtream' ? styles.activeTab : ''}`}
            onClick={() => setTab('xtream')}
          >
            Xtream Codes
          </button>
          <button
            className={`${styles.tab} ${tab === 'm3u' ? styles.activeTab : ''}`}
            onClick={() => setTab('m3u')}
          >
            M3U URL
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Playlist Name</label>
            <input
              type="text"
              placeholder="My IPTV"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          {tab === 'xtream' ? (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Server URL</label>
                <input
                  type="url"
                  placeholder="http://provider.com:8080"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <label className={styles.label}>M3U Playlist URL</label>
              <input
                type="url"
                placeholder="http://provider.com/playlist.m3u"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          {testResult && testResult.ok && (
            <div className={styles.success}>Connection successful!</div>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={handleTest} disabled={testing} className={styles.testBtn}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Adding...' : 'Add Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Setup CSS Module**

Create `client/src/pages/Setup.module.css`:

```css
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  animation: fadeInScale var(--transition-normal) ease;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 40px;
  color: var(--accent);
  display: block;
  margin-bottom: 12px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1px;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px;
  border-radius: var(--radius-sm);
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.activeTab {
  background: var(--accent);
  color: white;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.fieldRow {
  display: flex;
  gap: 12px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.input {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input:focus {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

.error {
  padding: 10px 14px;
  background: rgba(255, 79, 106, 0.1);
  border: 1px solid rgba(255, 79, 106, 0.3);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: 13px;
}

.success {
  padding: 10px 14px;
  background: rgba(79, 255, 142, 0.1);
  border: 1px solid rgba(79, 255, 142, 0.3);
  border-radius: var(--radius-sm);
  color: var(--success);
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.testBtn {
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all var(--transition-fast);
}

.testBtn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.testBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submitBtn {
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: white;
  transition: all var(--transition-fast);
}

.submitBtn:hover {
  background: var(--accent-hover);
}

.submitBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Wire Setup page in App.jsx**

Replace the Setup import placeholder in `client/src/App.jsx`:

```jsx
import Setup from './pages/Setup.jsx';
```

And replace `<Placeholder name="Setup" />` with `<Setup />`.

- [ ] **Step 4: Verify Setup page renders**

```bash
# With dev server running, visit http://localhost:5173/setup
# Should see styled card with Xtream Codes / M3U tabs, input fields, test & add buttons
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Setup.jsx client/src/pages/Setup.module.css client/src/App.jsx
git commit -m "feat: add Setup page with Xtream Codes and M3U onboarding"
```

---

### Task 12: Skeleton Loader Component

**Files:**
- Create: `client/src/components/Skeleton/Skeleton.jsx`
- Create: `client/src/components/Skeleton/Skeleton.module.css`

- [ ] **Step 1: Create Skeleton component**

Create `client/src/components/Skeleton/Skeleton.jsx`:

```jsx
import React from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({ width, height, radius, style }) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: radius || 'var(--radius-sm)',
        ...style,
      }}
    />
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className={styles.channelCard}>
      <Skeleton width="48px" height="48px" radius="50%" />
      <div className={styles.channelInfo}>
        <Skeleton width="120px" height="14px" />
        <Skeleton width="180px" height="12px" />
        <Skeleton width="100%" height="4px" radius="2px" />
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className={styles.contentCard}>
      <Skeleton height="220px" radius="var(--radius-sm)" />
      <Skeleton width="80%" height="14px" style={{ marginTop: 10 }} />
      <Skeleton width="50%" height="12px" style={{ marginTop: 6 }} />
    </div>
  );
}
```

- [ ] **Step 2: Create Skeleton CSS Module**

Create `client/src/components/Skeleton/Skeleton.module.css`:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.channelCard {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.channelInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contentCard {
  width: 160px;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/Skeleton/
git commit -m "feat: add Skeleton loader components for channels and content cards"
```

---

### Task 13: Channel Card & Category Sidebar Components

**Files:**
- Create: `client/src/components/ChannelCard/ChannelCard.jsx`
- Create: `client/src/components/ChannelCard/ChannelCard.module.css`
- Create: `client/src/components/CategorySidebar/CategorySidebar.jsx`
- Create: `client/src/components/CategorySidebar/CategorySidebar.module.css`

- [ ] **Step 1: Create ChannelCard**

Create `client/src/components/ChannelCard/ChannelCard.jsx`:

```jsx
import React from 'react';
import styles from './ChannelCard.module.css';

export default function ChannelCard({ channel, epg, isFavorite, onPlay, onToggleFavorite, index }) {
  const progress = epg?.current ? getProgress(epg.current.start, epg.current.stop) : 0;

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${(index % 20) * 0.03}s` }}
      onClick={() => onPlay(channel)}
    >
      <div className={styles.logoWrapper}>
        {channel.logo ? (
          <img src={channel.logo} alt="" className={styles.logo} loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div className={styles.logoFallback} style={channel.logo ? { display: 'none' } : {}}>
          {channel.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{channel.name}</div>
        {epg?.current && (
          <div className={styles.program}>{epg.current.title}</div>
        )}
        {progress > 0 && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <button
        className={`${styles.favBtn} ${isFavorite ? styles.favActive : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>
    </div>
  );
}

function getProgress(start, stop) {
  const now = Date.now();
  if (now < start || now > stop) return 0;
  return Math.round(((now - start) / (stop - start)) * 100);
}
```

- [ ] **Step 2: Create ChannelCard CSS Module**

Create `client/src/components/ChannelCard/ChannelCard.module.css`:

```css
.card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  animation: fadeIn var(--transition-normal) ease both;
  border: 1px solid transparent;
}

.card:hover {
  background: var(--surface-hover);
  border-color: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.logoWrapper {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  position: relative;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.04);
}

.logoFallback {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.program {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.progressBar {
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #7c3aed);
  border-radius: 2px;
  transition: width 1s linear;
}

.favBtn {
  font-size: 16px;
  padding: 6px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.card:hover .favBtn {
  opacity: 0.7;
}

.favBtn:hover {
  opacity: 1 !important;
}

.favActive {
  opacity: 1 !important;
}
```

- [ ] **Step 3: Create CategorySidebar**

Create `client/src/components/CategorySidebar/CategorySidebar.jsx`:

```jsx
import React from 'react';
import styles from './CategorySidebar.module.css';

export default function CategorySidebar({ categories, selected, onSelect, loading }) {
  return (
    <div className={styles.sidebar}>
      <button
        className={`${styles.item} ${!selected ? styles.active : ''}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`${styles.item} ${selected === cat.id ? styles.active : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create CategorySidebar CSS Module**

Create `client/src/components/CategorySidebar/CategorySidebar.module.css`:

```css
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 8px;
}

.item {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.active {
  color: var(--accent);
  background: rgba(79, 142, 255, 0.1);
  font-weight: 600;
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ChannelCard/ client/src/components/CategorySidebar/
git commit -m "feat: add ChannelCard and CategorySidebar components"
```

---

### Task 14: Content Card & Content Modal Components

**Files:**
- Create: `client/src/components/ContentCard/ContentCard.jsx`
- Create: `client/src/components/ContentCard/ContentCard.module.css`
- Create: `client/src/components/ContentModal/ContentModal.jsx`
- Create: `client/src/components/ContentModal/ContentModal.module.css`

- [ ] **Step 1: Create ContentCard**

Create `client/src/components/ContentCard/ContentCard.jsx`:

```jsx
import React, { useState } from 'react';
import styles from './ContentCard.module.css';

export default function ContentCard({ item, isFavorite, onClick, onToggleFavorite, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${(index % 20) * 0.03}s` }}
      onClick={() => onClick(item)}
    >
      <div className={styles.posterWrapper}>
        {item.logo ? (
          <>
            <div className={styles.posterPlaceholder} style={imgLoaded ? { display: 'none' } : {}} />
            <img
              src={item.logo}
              alt=""
              className={styles.poster}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { e.target.style.display = 'none'; }}
              style={imgLoaded ? {} : { opacity: 0 }}
            />
          </>
        ) : (
          <div className={styles.posterFallback}>
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        {onToggleFavorite && (
          <button
            className={`${styles.favBtn} ${isFavorite ? styles.favActive : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
        {item.rating && (
          <div className={styles.rating}>⭐ {item.rating}</div>
        )}
      </div>
      <div className={styles.title}>{item.name}</div>
      {item.year && <div className={styles.year}>{item.year}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create ContentCard CSS Module**

Create `client/src/components/ContentCard/ContentCard.module.css`:

```css
.card {
  width: 160px;
  flex-shrink: 0;
  cursor: pointer;
  animation: fadeIn var(--transition-normal) ease both;
  transition: transform var(--transition-fast);
}

.card:hover {
  transform: scale(1.04);
}

.posterWrapper {
  width: 160px;
  height: 220px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  background: var(--surface);
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--transition-normal);
}

.posterPlaceholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.posterFallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #1c1c30, #2a1c40);
  color: var(--text-secondary);
}

.favBtn {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 14px;
  padding: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card:hover .favBtn {
  opacity: 0.8;
}

.favBtn:hover {
  opacity: 1 !important;
}

.favActive {
  opacity: 1 !important;
}

.rating {
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 4px;
}

.title {
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.year {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
```

- [ ] **Step 3: Create ContentModal**

Create `client/src/components/ContentModal/ContentModal.jsx`:

```jsx
import React, { useEffect } from 'react';
import styles from './ContentModal.module.css';

export default function ContentModal({ item, onClose, onPlay, children }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.content}>
          {item.logo && (
            <div className={styles.posterCol}>
              <img src={item.logo} alt="" className={styles.poster} />
            </div>
          )}
          <div className={styles.details}>
            <h2 className={styles.title}>{item.name}</h2>
            <div className={styles.meta}>
              {item.year && <span>{item.year}</span>}
              {item.rating && <span>⭐ {item.rating}</span>}
              {item.duration && <span>{item.duration}</span>}
            </div>
            {item.plot && <p className={styles.plot}>{item.plot}</p>}
            {onPlay && (
              <button className={styles.playBtn} onClick={() => onPlay(item)}>
                ▶ Play
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ContentModal CSS Module**

Create `client/src/components/ContentModal/ContentModal.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 200ms ease;
}

.modal {
  width: 90%;
  max-width: 720px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  animation: fadeInScale var(--transition-normal) ease;
}

.closeBtn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  z-index: 1;
}

.closeBtn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.content {
  display: flex;
  gap: 24px;
  padding: 32px;
}

.posterCol {
  flex-shrink: 0;
}

.poster {
  width: 200px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.details {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.plot {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.playBtn {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.playBtn:hover {
  background: var(--accent-hover);
  transform: scale(1.02);
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ContentCard/ client/src/components/ContentModal/
git commit -m "feat: add ContentCard and ContentModal components"
```

---

### Task 15: Video Player Component

**Files:**
- Create: `client/src/components/Player/Player.jsx`
- Create: `client/src/components/Player/Player.module.css`

- [ ] **Step 1: Create Player component**

Create `client/src/components/Player/Player.jsx`:

```jsx
import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';
import { PlayerContext } from '../../App.jsx';
import styles from './Player.module.css';

export default function Player() {
  const { isOpen, currentItem, close, attachVideo, hlsRef } = useContext(PlayerContext);
  const videoRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('fit');

  const aspectRatios = ['fit', 'fill', '16:9', '4:3'];

  useEffect(() => {
    if (isOpen && videoRef.current) {
      attachVideo(videoRef.current);
    }
  }, [isOpen, currentItem, attachVideo]);

  // Audio tracks from HLS
  useEffect(() => {
    if (!hlsRef?.current) return;
    const hls = hlsRef.current;
    const onAudioTracks = () => {
      setAudioTracks(hls.audioTracks || []);
    };
    hls.on('hlsAudioTracksUpdated', onAudioTracks);
    return () => hls.off('hlsAudioTracksUpdated', onAudioTracks);
  }, [hlsRef, isOpen]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      resetControlsTimer();
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          setVolume(video.volume);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          setVolume(video.volume);
          break;
        case 'f':
          document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen?.();
          break;
        case 'm':
          video.muted = !video.muted;
          setIsMuted(video.muted);
          break;
        case 'Escape':
          close();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close, resetControlsTimer]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setIsPlaying(!video.paused);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * duration;
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const cycleAspectRatio = () => {
    const idx = aspectRatios.indexOf(aspectRatio);
    setAspectRatio(aspectRatios[(idx + 1) % aspectRatios.length]);
  };

  const changeAudioTrack = (idx) => {
    if (hlsRef?.current) {
      hlsRef.current.audioTrack = idx;
    }
    setSelectedAudioTrack(idx);
  };

  const getVideoStyle = () => {
    switch (aspectRatio) {
      case 'fill': return { objectFit: 'cover' };
      case '16:9': return { objectFit: 'contain', aspectRatio: '16/9' };
      case '4:3': return { objectFit: 'contain', aspectRatio: '4/3' };
      default: return { objectFit: 'contain' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseMove={resetControlsTimer}>
      <video
        ref={videoRef}
        className={styles.video}
        style={getVideoStyle()}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={() => {
          const video = videoRef.current;
          video?.paused ? video.play() : video.pause();
        }}
      />

      <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
        <div className={styles.topBar}>
          <div className={styles.nowPlaying}>{currentItem?.name || ''}</div>
          <button className={styles.closeBtn} onClick={close}>✕</button>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.seekBar} onClick={handleSeek}>
            <div className={styles.seekFill} style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
          </div>

          <div className={styles.controlsRow}>
            <button className={styles.controlBtn} onClick={() => {
              const video = videoRef.current;
              video?.paused ? video.play() : video.pause();
            }}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className={styles.spacer} />

            <div className={styles.volumeControl}>
              <button className={styles.controlBtn} onClick={() => {
                const video = videoRef.current;
                if (video) { video.muted = !video.muted; setIsMuted(!isMuted); }
              }}>
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>

            {audioTracks.length > 1 && (
              <select
                className={styles.trackSelect}
                value={selectedAudioTrack}
                onChange={(e) => changeAudioTrack(parseInt(e.target.value))}
              >
                {audioTracks.map((track, idx) => (
                  <option key={idx} value={idx}>
                    🔈 {track.name || track.lang || `Track ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            <button className={styles.controlBtn} onClick={cycleAspectRatio}>
              {aspectRatio === 'fit' ? '⬜' : aspectRatio === 'fill' ? '⬛' : aspectRatio}
            </button>

            <button className={styles.controlBtn} onClick={() => {
              const video = videoRef.current;
              document.fullscreenElement ? document.exitFullscreen() : video?.requestFullscreen?.();
            }}>
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Create Player CSS Module**

Create `client/src/components/Player/Player.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 200ms ease;
}

.video {
  width: 100%;
  height: 100%;
  background: #000;
}

.controls {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
}

.visible {
  opacity: 1;
  pointer-events: auto;
}

.topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
}

.nowPlaying {
  font-size: 16px;
  font-weight: 600;
}

.closeBtn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background var(--transition-fast);
}

.closeBtn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.bottomBar {
  padding: 0 24px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.seekBar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: height var(--transition-fast);
}

.seekBar:hover {
  height: 6px;
}

.seekFill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  position: relative;
}

.seekFill::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.seekBar:hover .seekFill::after {
  opacity: 1;
}

.controlsRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controlBtn {
  font-size: 18px;
  padding: 6px;
  opacity: 0.9;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.controlBtn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

.spacer {
  flex: 1;
}

.volumeControl {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volumeSlider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  border: none;
  padding: 0;
}

.volumeSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

.trackSelect {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: white;
}
```

- [ ] **Step 3: Add Player to App.jsx**

In `client/src/App.jsx`, import Player and render it inside the PlayerContext.Provider, after BrowserRouter closes:

```jsx
import Player from './components/Player/Player.jsx';
```

Add `<Player />` just before the closing `</PlayerContext.Provider>` tag.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Player/ client/src/App.jsx
git commit -m "feat: add video Player component with HLS, keyboard shortcuts, and controls"
```

---

### Task 16: Live TV Page

**Files:**
- Create: `client/src/pages/LiveTV.jsx`
- Create: `client/src/pages/LiveTV.module.css`
- Modify: `client/src/App.jsx` (wire real page)

- [ ] **Step 1: Create LiveTV page**

Create `client/src/pages/LiveTV.jsx`:

```jsx
import React, { useState, useContext, useEffect } from 'react';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getLiveCategories, getLiveChannels, getFavorites, toggleFavorite } from '../api/client.js';
import CategorySidebar from '../components/CategorySidebar/CategorySidebar.jsx';
import ChannelCard from '../components/ChannelCard/ChannelCard.jsx';
import { ChannelCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './LiveTV.module.css';

export default function LiveTV() {
  const player = useContext(PlayerContext);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const { data: categories, loading: catLoading } = useApi(() => getLiveCategories(), []);
  const { data: channels, loading: chLoading } = useApi(
    () => getLiveChannels(selectedCategory),
    [selectedCategory]
  );
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.live || [];

  const handleToggleFav = async (id) => {
    await toggleFavorite('live', id);
    reloadFavs();
  };

  return (
    <div className={styles.page}>
      <CategorySidebar
        categories={categories || []}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        loading={catLoading}
      />
      <div className={styles.main}>
        <div className={styles.header}>
          <h2 className={styles.title}>Live TV</h2>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('grid')}
            >▦</button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('list')}
            >☰</button>
          </div>
          {channels && <span className={styles.count}>{channels.length} channels</span>}
        </div>
        <div className={viewMode === 'grid' ? styles.grid : styles.list}>
          {chLoading ? (
            Array.from({ length: 12 }).map((_, i) => <ChannelCardSkeleton key={i} />)
          ) : (
            (channels || []).map((ch, idx) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                isFavorite={favIds.includes(String(ch.id))}
                onPlay={(item) => player.play(item)}
                onToggleFavorite={handleToggleFav}
                index={idx}
              />
            ))
          )}
        </div>
        {!chLoading && channels?.length === 0 && (
          <div className={styles.empty}>No channels found</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create LiveTV CSS Module**

Create `client/src/pages/LiveTV.module.css`:

```css
.page {
  display: flex;
  gap: 24px;
}

.main {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.count {
  font-size: 13px;
  color: var(--text-secondary);
}

.viewToggle {
  display: flex;
  gap: 2px;
  background: var(--surface);
  border-radius: 6px;
  padding: 2px;
  margin-left: auto;
}

.viewBtn {
  padding: 6px 10px;
  font-size: 14px;
  border-radius: 4px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.viewBtn:hover {
  color: var(--text-primary);
}

.viewActive {
  background: var(--accent);
  color: white;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}
```

- [ ] **Step 3: Wire LiveTV in App.jsx**

Replace the Live TV placeholder import:

```jsx
import LiveTV from './pages/LiveTV.jsx';
```

Replace `<Placeholder name="Live TV" />` with `<LiveTV />`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/LiveTV.jsx client/src/pages/LiveTV.module.css client/src/App.jsx
git commit -m "feat: add Live TV page with category sidebar, channel grid, and favorites"
```

---

### Task 17: Movies (VOD) Page

**Files:**
- Create: `client/src/pages/Movies.jsx`
- Create: `client/src/pages/Movies.module.css`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create Movies page**

Create `client/src/pages/Movies.jsx`:

```jsx
import React, { useState, useContext } from 'react';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getVodCategories, getVodMovies, getFavorites, toggleFavorite } from '../api/client.js';
import ContentCard from '../components/ContentCard/ContentCard.jsx';
import ContentModal from '../components/ContentModal/ContentModal.jsx';
import { ContentCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './Movies.module.css';

export default function Movies() {
  const player = useContext(PlayerContext);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const { data: categories } = useApi(() => getVodCategories(), []);
  const { data: movies, loading } = useApi(
    () => getVodMovies(selectedCategory || undefined),
    [selectedCategory]
  );
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.vod || [];

  const handleToggleFav = async (id) => {
    await toggleFavorite('vod', id);
    reloadFavs();
  };

  // Group movies by category for Netflix-style rows when no filter
  const groupedByCategory = () => {
    if (selectedCategory || !movies || !categories) return null;
    const groups = {};
    for (const movie of movies) {
      const catId = String(movie.group);
      if (!groups[catId]) groups[catId] = [];
      if (groups[catId].length < 20) groups[catId].push(movie);
    }
    return categories
      .filter(c => groups[c.id]?.length > 0)
      .map(c => ({ category: c, movies: groups[c.id] }))
      .slice(0, 30);
  };

  const grouped = groupedByCategory();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Movies</h2>
        <select
          className={styles.categorySelect}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {(categories || []).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 12 }).map((_, i) => <ContentCardSkeleton key={i} />)}
        </div>
      ) : grouped ? (
        grouped.map(({ category, movies }) => (
          <div key={category.id} className={styles.row}>
            <h3 className={styles.rowTitle}>{category.name}</h3>
            <div className={styles.rowScroll}>
              {movies.map((movie, idx) => (
                <ContentCard
                  key={movie.id}
                  item={movie}
                  isFavorite={favIds.includes(String(movie.id))}
                  onClick={setSelectedMovie}
                  onToggleFavorite={handleToggleFav}
                  index={idx}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.grid}>
          {(movies || []).map((movie, idx) => (
            <ContentCard
              key={movie.id}
              item={movie}
              isFavorite={favIds.includes(String(movie.id))}
              onClick={setSelectedMovie}
              onToggleFavorite={handleToggleFav}
              index={idx}
            />
          ))}
        </div>
      )}

      {!loading && movies?.length === 0 && (
        <div className={styles.empty}>No movies found</div>
      )}

      <ContentModal
        item={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={(item) => { setSelectedMovie(null); player.play(item); }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create Movies CSS Module**

Create `client/src/pages/Movies.module.css`:

```css
.page {
  max-width: 100%;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.categorySelect {
  margin-left: auto;
  padding: 8px 12px;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  min-width: 180px;
}

.row {
  margin-bottom: 32px;
}

.rowTitle {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.rowScroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
}

.rowScroll > * {
  scroll-snap-align: start;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}
```

- [ ] **Step 3: Wire Movies in App.jsx**

```jsx
import Movies from './pages/Movies.jsx';
```

Replace `<Placeholder name="Movies" />` with `<Movies />`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Movies.jsx client/src/pages/Movies.module.css client/src/App.jsx
git commit -m "feat: add Movies page with Netflix-style category rows and detail modal"
```

---

### Task 18: Series Page & Series Detail Page

**Files:**
- Create: `client/src/pages/Series.jsx`
- Create: `client/src/pages/Series.module.css`
- Create: `client/src/pages/SeriesDetail.jsx`
- Create: `client/src/pages/SeriesDetail.module.css`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create Series browse page**

Create `client/src/pages/Series.jsx`:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { getSeriesCategories, getSeriesList, getFavorites, toggleFavorite } from '../api/client.js';
import ContentCard from '../components/ContentCard/ContentCard.jsx';
import { ContentCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './Series.module.css';

export default function SeriesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: categories } = useApi(() => getSeriesCategories(), []);
  const { data: series, loading } = useApi(
    () => getSeriesList(selectedCategory || undefined),
    [selectedCategory]
  );
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.series || [];

  const handleToggleFav = async (id) => {
    await toggleFavorite('series', id);
    reloadFavs();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Series</h2>
        <select
          className={styles.categorySelect}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {(categories || []).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.grid}>
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => <ContentCardSkeleton key={i} />)
        ) : (
          (series || []).map((s, idx) => (
            <ContentCard
              key={s.id}
              item={s}
              isFavorite={favIds.includes(String(s.id))}
              onClick={() => navigate(`/series/${s.id}`)}
              onToggleFavorite={handleToggleFav}
              index={idx}
            />
          ))
        )}
      </div>

      {!loading && series?.length === 0 && (
        <div className={styles.empty}>No series found</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create Series CSS Module**

Create `client/src/pages/Series.module.css`:

```css
.page {
  max-width: 100%;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.categorySelect {
  margin-left: auto;
  padding: 8px 12px;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  min-width: 180px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}
```

- [ ] **Step 3: Create SeriesDetail page**

Create `client/src/pages/SeriesDetail.jsx`:

```jsx
import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getSeriesDetail } from '../api/client.js';
import styles from './SeriesDetail.module.css';

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const player = useContext(PlayerContext);
  const { data: series, loading } = useApi(() => getSeriesDetail(id), [id]);
  const [activeSeason, setActiveSeason] = useState(null);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!series) return <div className={styles.empty}>Series not found</div>;

  const seasons = series.seasons ? Object.keys(series.seasons).sort((a, b) => Number(a) - Number(b)) : [];
  const currentSeason = activeSeason || seasons[0];
  const episodes = series.seasons?.[currentSeason] || [];

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/series')}>
        ← Back to Series
      </button>

      <div className={styles.hero}>
        {series.logo && <img src={series.logo} alt="" className={styles.poster} />}
        <div className={styles.info}>
          <h1 className={styles.title}>{series.name}</h1>
          <div className={styles.meta}>
            {series.year && <span>{series.year}</span>}
            {series.rating && <span>⭐ {series.rating}</span>}
            {seasons.length > 0 && <span>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>}
          </div>
          {series.plot && <p className={styles.plot}>{series.plot}</p>}
        </div>
      </div>

      {seasons.length > 0 && (
        <div className={styles.seasonTabs}>
          {seasons.map(s => (
            <button
              key={s}
              className={`${styles.seasonTab} ${currentSeason === s ? styles.activeTab : ''}`}
              onClick={() => setActiveSeason(s)}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.episodes}>
        {episodes.map((ep, idx) => (
          <div
            key={ep.id}
            className={styles.episode}
            onClick={() => player.play({ ...ep, name: `${series.name} - S${currentSeason}E${ep.episodeNum}` })}
          >
            <div className={styles.epNumber}>{ep.episodeNum}</div>
            <div className={styles.epInfo}>
              <div className={styles.epTitle}>{ep.title}</div>
              {ep.plot && <div className={styles.epPlot}>{ep.plot}</div>}
            </div>
            {ep.duration && <div className={styles.epDuration}>{ep.duration}</div>}
            <button className={styles.epPlay}>▶</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create SeriesDetail CSS Module**

Create `client/src/pages/SeriesDetail.module.css`:

```css
.page {
  max-width: 900px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
}

.backBtn {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  transition: color var(--transition-fast);
}

.backBtn:hover {
  color: var(--accent);
}

.hero {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.poster {
  width: 200px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.info {
  flex: 1;
}

.title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.plot {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.seasonTabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.seasonTab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.seasonTab:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.activeTab {
  color: var(--accent);
  background: rgba(79, 142, 255, 0.1);
}

.episodes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.episode {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.episode:hover {
  background: var(--surface-hover);
}

.epNumber {
  width: 32px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.epInfo {
  flex: 1;
  min-width: 0;
}

.epTitle {
  font-size: 14px;
  font-weight: 600;
}

.epPlot {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.epDuration {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.epPlay {
  font-size: 14px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.episode:hover .epPlay {
  opacity: 0.8;
}
```

- [ ] **Step 5: Wire Series pages in App.jsx**

```jsx
import SeriesPage from './pages/Series.jsx';
import SeriesDetail from './pages/SeriesDetail.jsx';
```

Replace `<Placeholder name="Series" />` with `<SeriesPage />` and `<Placeholder name="Series Detail" />` with `<SeriesDetail />`.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Series.jsx client/src/pages/Series.module.css client/src/pages/SeriesDetail.jsx client/src/pages/SeriesDetail.module.css client/src/App.jsx
git commit -m "feat: add Series browse page and SeriesDetail with season/episode navigation"
```

---

### Task 19: EPG (Program Guide) Page

**Files:**
- Create: `client/src/components/EPGGrid/EPGGrid.jsx`
- Create: `client/src/components/EPGGrid/EPGGrid.module.css`
- Create: `client/src/pages/EPG.jsx`
- Create: `client/src/pages/EPG.module.css`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create EPGGrid component**

Create `client/src/components/EPGGrid/EPGGrid.jsx`:

```jsx
import React, { useRef, useEffect, useMemo } from 'react';
import styles from './EPGGrid.module.css';

const SLOT_WIDTH = 180; // pixels per 30 minutes
const ROW_HEIGHT = 56;
const HOURS_TO_SHOW = 6;

export default function EPGGrid({ schedule, channels, onProgramClick }) {
  const scrollRef = useRef(null);
  const now = Date.now();
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - 1, 0, 0, 0);
  const gridStart = startTime.getTime();
  const gridEnd = gridStart + HOURS_TO_SHOW * 60 * 60 * 1000;

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const offsetMinutes = (now - gridStart) / 60000;
      const offsetPx = (offsetMinutes / 30) * SLOT_WIDTH - 200;
      scrollRef.current.scrollLeft = Math.max(0, offsetPx);
    }
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let t = gridStart; t < gridEnd; t += 30 * 60 * 1000) {
      slots.push(t);
    }
    return slots;
  }, [gridStart, gridEnd]);

  const totalWidth = timeSlots.length * SLOT_WIDTH;
  const nowOffset = ((now - gridStart) / 60000 / 30) * SLOT_WIDTH;

  return (
    <div className={styles.container}>
      <div className={styles.channelList}>
        <div className={styles.timeHeader} />
        {channels.map(ch => (
          <div key={ch.id} className={styles.channelRow}>
            <div className={styles.channelName}>{ch.name}</div>
          </div>
        ))}
      </div>
      <div className={styles.gridScroll} ref={scrollRef}>
        <div className={styles.timeRow} style={{ width: totalWidth }}>
          {timeSlots.map(t => (
            <div key={t} className={styles.timeSlot} style={{ width: SLOT_WIDTH }}>
              {new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          ))}
        </div>
        <div className={styles.gridBody} style={{ width: totalWidth }}>
          {channels.map(ch => {
            const programs = schedule[ch.epgChannelId] || schedule[ch.id] || [];
            return (
              <div key={ch.id} className={styles.programRow} style={{ height: ROW_HEIGHT }}>
                {programs
                  .filter(p => p.stop > gridStart && p.start < gridEnd)
                  .map((prog, idx) => {
                    const left = Math.max(0, ((prog.start - gridStart) / 60000 / 30) * SLOT_WIDTH);
                    const right = Math.min(totalWidth, ((prog.stop - gridStart) / 60000 / 30) * SLOT_WIDTH);
                    const width = right - left;
                    const isNow = prog.start <= now && prog.stop > now;
                    return (
                      <div
                        key={idx}
                        className={`${styles.program} ${isNow ? styles.programNow : ''}`}
                        style={{ left, width: Math.max(width, 2) }}
                        onClick={() => onProgramClick?.(prog, ch)}
                        title={prog.title}
                      >
                        <span className={styles.programTitle}>{prog.title}</span>
                      </div>
                    );
                  })}
              </div>
            );
          })}
          <div className={styles.nowLine} style={{ left: nowOffset }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create EPGGrid CSS Module**

Create `client/src/components/EPGGrid/EPGGrid.module.css`:

```css
.container {
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface);
}

.channelList {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 2;
  background: var(--surface);
}

.timeHeader {
  height: 36px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.channelRow {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.channelName {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gridScroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.timeRow {
  display: flex;
  height: 36px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}

.timeSlot {
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  color: var(--text-secondary);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.gridBody {
  position: relative;
}

.programRow {
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.program {
  position: absolute;
  top: 2px;
  height: calc(100% - 4px);
  background: rgba(79, 142, 255, 0.12);
  border: 1px solid rgba(79, 142, 255, 0.2);
  border-radius: 4px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  transition: background var(--transition-fast);
}

.program:hover {
  background: rgba(79, 142, 255, 0.2);
}

.programNow {
  background: rgba(79, 142, 255, 0.2);
  border-color: var(--accent);
}

.programTitle {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nowLine {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--danger);
  z-index: 3;
  pointer-events: none;
}
```

- [ ] **Step 3: Create EPG page**

Create `client/src/pages/EPG.jsx`:

```jsx
import React, { useContext } from 'react';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getEpgGrid, getLiveChannels } from '../api/client.js';
import EPGGrid from '../components/EPGGrid/EPGGrid.jsx';
import styles from './EPG.module.css';

export default function EPGPage() {
  const player = useContext(PlayerContext);
  const { data: schedule, loading: epgLoading } = useApi(() => getEpgGrid(), []);
  const { data: channels, loading: chLoading } = useApi(() => getLiveChannels(), []);

  const loading = epgLoading || chLoading;

  const handleProgramClick = (program, channel) => {
    // Play the channel
    player.play(channel);
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Program Guide</h2>
      {loading ? (
        <div className={styles.loading}>Loading EPG data...</div>
      ) : !schedule || Object.keys(schedule).length === 0 ? (
        <div className={styles.empty}>
          No EPG data available. Make sure your provider supports EPG or configure an XMLTV URL in Settings.
        </div>
      ) : (
        <EPGGrid
          schedule={schedule}
          channels={channels || []}
          onProgramClick={handleProgramClick}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create EPG CSS Module**

Create `client/src/pages/EPG.module.css`:

```css
.page {
  max-width: 100%;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}
```

- [ ] **Step 5: Wire EPG in App.jsx**

```jsx
import EPGPage from './pages/EPG.jsx';
```

Replace `<Placeholder name="EPG" />` with `<EPGPage />`.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/EPGGrid/ client/src/pages/EPG.jsx client/src/pages/EPG.module.css client/src/App.jsx
git commit -m "feat: add EPG page with timeline grid, current-time indicator, and program details"
```

---

### Task 20: Favorites Page

**Files:**
- Create: `client/src/pages/Favorites.jsx`
- Create: `client/src/pages/Favorites.module.css`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create Favorites page**

Create `client/src/pages/Favorites.jsx`:

```jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getFavorites, toggleFavorite, getLiveChannels, getVodMovies, getSeriesList } from '../api/client.js';
import ChannelCard from '../components/ChannelCard/ChannelCard.jsx';
import ContentCard from '../components/ContentCard/ContentCard.jsx';
import styles from './Favorites.module.css';

export default function Favorites() {
  const player = useContext(PlayerContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('live');

  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);
  const { data: channels } = useApi(() => getLiveChannels(), []);
  const { data: movies } = useApi(() => getVodMovies(), []);
  const { data: series } = useApi(() => getSeriesList(), []);

  const favChannels = (channels || []).filter(c => (favorites?.live || []).includes(String(c.id)));
  const favMovies = (movies || []).filter(m => (favorites?.vod || []).includes(String(m.id)));
  const favSeries = (series || []).filter(s => (favorites?.series || []).includes(String(s.id)));

  const handleToggleFav = async (type, id) => {
    await toggleFavorite(type, id);
    reloadFavs();
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Favorites</h2>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'live' ? styles.activeTab : ''}`} onClick={() => setTab('live')}>
          Channels ({favChannels.length})
        </button>
        <button className={`${styles.tab} ${tab === 'vod' ? styles.activeTab : ''}`} onClick={() => setTab('vod')}>
          Movies ({favMovies.length})
        </button>
        <button className={`${styles.tab} ${tab === 'series' ? styles.activeTab : ''}`} onClick={() => setTab('series')}>
          Series ({favSeries.length})
        </button>
      </div>

      {tab === 'live' && (
        <div className={styles.channelGrid}>
          {favChannels.length === 0 ? (
            <div className={styles.empty}>No favorite channels yet</div>
          ) : (
            favChannels.map((ch, idx) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                isFavorite={true}
                onPlay={(item) => player.play(item)}
                onToggleFavorite={(id) => handleToggleFav('live', id)}
                index={idx}
              />
            ))
          )}
        </div>
      )}

      {tab === 'vod' && (
        <div className={styles.contentGrid}>
          {favMovies.length === 0 ? (
            <div className={styles.empty}>No favorite movies yet</div>
          ) : (
            favMovies.map((movie, idx) => (
              <ContentCard
                key={movie.id}
                item={movie}
                isFavorite={true}
                onClick={() => player.play(movie)}
                onToggleFavorite={(id) => handleToggleFav('vod', id)}
                index={idx}
              />
            ))
          )}
        </div>
      )}

      {tab === 'series' && (
        <div className={styles.contentGrid}>
          {favSeries.length === 0 ? (
            <div className={styles.empty}>No favorite series yet</div>
          ) : (
            favSeries.map((s, idx) => (
              <ContentCard
                key={s.id}
                item={s}
                isFavorite={true}
                onClick={() => navigate(`/series/${s.id}`)}
                onToggleFavorite={(id) => handleToggleFav('series', id)}
                index={idx}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create Favorites CSS Module**

Create `client/src/pages/Favorites.module.css`:

```css
.page {
  max-width: 100%;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px;
  border-radius: var(--radius-sm);
  width: fit-content;
}

.tab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.activeTab {
  background: var(--accent);
  color: white;
}

.channelGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.contentGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}
```

- [ ] **Step 3: Wire Favorites in App.jsx**

```jsx
import Favorites from './pages/Favorites.jsx';
```

Replace `<Placeholder name="Favorites" />` with `<Favorites />`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Favorites.jsx client/src/pages/Favorites.module.css client/src/App.jsx
git commit -m "feat: add Favorites page with tabs for channels, movies, and series"
```

---

### Task 21: Search Page

**Files:**
- Create: `client/src/components/Search/SearchBar.jsx`
- Create: `client/src/components/Search/SearchResults.jsx`
- Create: `client/src/components/Search/Search.module.css`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create Search components**

Create `client/src/components/Search/SearchBar.jsx`:

```jsx
import React, { useRef, useEffect } from 'react';
import styles from './Search.module.css';

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search channels, movies, series..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.input}
    />
  );
}
```

Create `client/src/components/Search/SearchResults.jsx`:

```jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerContext } from '../../App.jsx';
import styles from './Search.module.css';

export default function SearchResults({ results }) {
  const player = useContext(PlayerContext);
  const navigate = useNavigate();

  if (!results) return null;

  const { live, vod, series } = results;
  const hasResults = live.length > 0 || vod.length > 0 || series.length > 0;

  if (!hasResults) {
    return <div className={styles.empty}>No results found</div>;
  }

  return (
    <div className={styles.results}>
      {live.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Live TV ({live.length})</h3>
          <div className={styles.list}>
            {live.map(ch => (
              <div key={ch.id} className={styles.resultItem} onClick={() => player.play(ch)}>
                {ch.logo && <img src={ch.logo} alt="" className={styles.resultLogo} />}
                <div className={styles.resultName}>{ch.name}</div>
                <span className={styles.badge}>Live</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vod.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Movies ({vod.length})</h3>
          <div className={styles.list}>
            {vod.map(m => (
              <div key={m.id} className={styles.resultItem} onClick={() => player.play(m)}>
                {m.logo && <img src={m.logo} alt="" className={styles.resultLogo} />}
                <div className={styles.resultName}>{m.name}</div>
                <span className={styles.badge}>Movie</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {series.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Series ({series.length})</h3>
          <div className={styles.list}>
            {series.map(s => (
              <div key={s.id} className={styles.resultItem} onClick={() => navigate(`/series/${s.id}`)}>
                {s.logo && <img src={s.logo} alt="" className={styles.resultLogo} />}
                <div className={styles.resultName}>{s.name}</div>
                <span className={styles.badge}>Series</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create Search CSS Module**

Create `client/src/components/Search/Search.module.css`:

```css
.input {
  width: 100%;
  max-width: 600px;
  padding: 14px 20px;
  font-size: 16px;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.input:focus {
  border-color: var(--accent);
  outline: none;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {}

.sectionTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resultItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.resultItem:hover {
  background: var(--surface-hover);
}

.resultLogo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.04);
}

.resultName {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(79, 142, 255, 0.1);
  color: var(--accent);
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 15px;
}
```

- [ ] **Step 3: Create Search page that uses these components**

We'll use the Search components directly in a page. Add a simple search page wrapper. Create a file in pages that we reference in App.jsx:

In `client/src/App.jsx`, add inline search page or create a wrapper:

Add this import and inline component at the top of App.jsx:

```jsx
import SearchBar from './components/Search/SearchBar.jsx';
import SearchResults from './components/Search/SearchResults.jsx';
import { searchAll } from './api/client.js';
```

Add a SearchPage component in App.jsx (before the default export):

```jsx
function SearchPage() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState(null);

  React.useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timer = setTimeout(() => {
      searchAll(query).then(setResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />
      <SearchResults results={results} />
    </div>
  );
}
```

Replace `<Placeholder name="Search" />` with `<SearchPage />`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Search/ client/src/App.jsx
git commit -m "feat: add Search page with real-time results grouped by content type"
```

---

### Task 22: Settings Page

**Files:**
- Create: `client/src/pages/Settings.jsx`
- Create: `client/src/pages/Settings.module.css`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create Settings page**

Create `client/src/pages/Settings.jsx`:

```jsx
import React, { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { getPlaylists, removePlaylist, activatePlaylist, updateSettings, getSettings } from '../api/client.js';
import styles from './Settings.module.css';

export default function Settings() {
  const { data: playlistData, reload: reloadPlaylists } = useApi(() => getPlaylists(), []);
  const { data: settings, reload: reloadSettings } = useApi(() => getSettings(), []);
  const [epgUrl, setEpgUrl] = useState('');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings?.epgUrl) setEpgUrl(settings.epgUrl);
  }, [settings]);

  const handleRemovePlaylist = async (id) => {
    await removePlaylist(id);
    reloadPlaylists();
  };

  const handleActivate = async (id) => {
    await activatePlaylist(id);
    reloadPlaylists();
    window.location.reload();
  };

  const handleSaveSettings = async () => {
    await updateSettings({ epgUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reloadSettings();
  };

  const playlists = playlistData?.playlists || [];
  const activeId = playlistData?.activePlaylistId;

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Settings</h2>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Playlists</h3>
        <div className={styles.playlists}>
          {playlists.map(p => (
            <div key={p.id} className={`${styles.playlistItem} ${p.id === activeId ? styles.activePl : ''}`}>
              <div className={styles.plInfo}>
                <div className={styles.plName}>
                  {p.name}
                  {p.id === activeId && <span className={styles.activeBadge}>Active</span>}
                </div>
                <div className={styles.plType}>{p.type === 'xtream' ? 'Xtream Codes' : 'M3U URL'}</div>
              </div>
              <div className={styles.plActions}>
                {p.id !== activeId && (
                  <button className={styles.actionBtn} onClick={() => handleActivate(p.id)}>
                    Activate
                  </button>
                )}
                <button className={styles.dangerBtn} onClick={() => handleRemovePlaylist(p.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={() => window.location.href = '/setup'}>
          + Add Playlist
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>EPG Source</h3>
        <p className={styles.hint}>
          Override the default EPG URL. Leave empty to use your provider's EPG.
        </p>
        <div className={styles.fieldRow}>
          <input
            type="url"
            placeholder="http://epg-provider.com/xmltv.xml"
            value={epgUrl}
            onChange={(e) => setEpgUrl(e.target.value)}
            className={styles.input}
          />
          <button className={styles.saveBtn} onClick={handleSaveSettings}>
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.about}>
          XtreamPlayer v1.0.0 — A locally-run browser-based IPTV player.
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create Settings CSS Module**

Create `client/src/pages/Settings.module.css`:

```css
.page {
  max-width: 700px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 32px;
}

.section {
  margin-bottom: 36px;
}

.sectionTitle {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.playlists {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.playlistItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.activePl {
  border-color: rgba(79, 142, 255, 0.3);
}

.plInfo { flex: 1; }

.plName {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activeBadge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(79, 142, 255, 0.15);
  color: var(--accent);
}

.plType {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.plActions {
  display: flex;
  gap: 8px;
}

.actionBtn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  background: rgba(79, 142, 255, 0.1);
  color: var(--accent);
  transition: all var(--transition-fast);
}

.actionBtn:hover {
  background: rgba(79, 142, 255, 0.2);
}

.dangerBtn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  background: rgba(255, 79, 106, 0.1);
  color: var(--danger);
  transition: all var(--transition-fast);
}

.dangerBtn:hover {
  background: rgba(255, 79, 106, 0.2);
}

.addBtn {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.addBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.fieldRow {
  display: flex;
  gap: 12px;
}

.input {
  flex: 1;
  padding: 10px 14px;
  font-size: 14px;
}

.saveBtn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: white;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.saveBtn:hover {
  background: var(--accent-hover);
}

.about {
  font-size: 13px;
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Wire Settings in App.jsx**

```jsx
import Settings from './pages/Settings.jsx';
```

Replace `<Placeholder name="Settings" />` with `<Settings />`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Settings.jsx client/src/pages/Settings.module.css client/src/App.jsx
git commit -m "feat: add Settings page with playlist management and EPG configuration"
```

---

### Task 23: Final App.jsx Wiring & Favicon

**Files:**
- Modify: `client/src/App.jsx` (remove all Placeholder references)
- Create: `client/public/favicon.svg`

- [ ] **Step 1: Create favicon**

Create `client/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0f"/>
  <polygon points="12,8 12,24 26,16" fill="#4f8eff"/>
</svg>
```

- [ ] **Step 2: Verify App.jsx has no remaining Placeholder references**

Review `client/src/App.jsx` and ensure all routes point to real page components. Remove the Placeholder function if it still exists.

- [ ] **Step 3: Commit**

```bash
git add client/public/favicon.svg client/src/App.jsx
git commit -m "feat: finalize App.jsx routing and add favicon"
```

---

### Task 24: End-to-End Smoke Test

- [ ] **Step 1: Install all dependencies**

```bash
cd /Users/moazamhakim/CodingProjects/xtreamplayer
npm install
cd client && npm install && cd ..
```

- [ ] **Step 2: Start the app**

```bash
npm run dev
```

- [ ] **Step 3: Verify all routes load without errors**

Open browser to `http://localhost:5173`:
- `/setup` — Should show the onboarding card with tabs
- After adding a playlist, `/live` — Should show nav + channel grid
- `/movies` — Should show Netflix-style rows or grid
- `/series` — Should show series grid
- `/epg` — Should show EPG grid (or empty state)
- `/favorites` — Should show tabs with empty states
- `/search` — Should show search input, type to get results
- `/settings` — Should show playlist management

- [ ] **Step 4: Verify video playback**

Add a test playlist (M3U or Xtream Codes) and:
- Click a channel to open the player
- Verify HLS playback starts
- Test keyboard shortcuts (space, arrow keys, f, m, escape)
- Test player controls

- [ ] **Step 5: Fix any issues found during smoke test**

Address any console errors, broken styles, or non-functional features.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete XtreamPlayer v1.0 - browser-based IPTV player"
```
