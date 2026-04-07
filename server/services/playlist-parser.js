import fetch from 'node-fetch';

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
      const classified = classifyItem(current);
      current.type = classified.type;
      current.seriesName = classified.seriesName;
      current.season = classified.season;
      current.episode = classified.episode;
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

  const tvgId = line.match(/tvg-id="([^"]*)"/);
  const tvgName = line.match(/tvg-name="([^"]*)"/);
  const tvgLogo = line.match(/tvg-logo="([^"]*)"/);
  const groupTitle = line.match(/group-title="([^"]*)"/);

  if (tvgId) item.tvgId = tvgId[1];
  if (tvgName) item.tvgName = tvgName[1];
  if (tvgLogo) item.logo = tvgLogo[1];
  if (groupTitle) item.group = groupTitle[1] || 'Uncategorized';

  const commaIdx = line.lastIndexOf(',');
  if (commaIdx !== -1) {
    item.name = line.substring(commaIdx + 1).trim();
  }

  return item;
}

// Episode detection patterns (ordered by specificity)
const EPISODE_PATTERNS = [
  // "S01E01" or "S01 E01" or "S1E1" or "S01.E01"
  /^(.+?)[\s.]*S(\d{1,2})[\s.]*E(\d{1,3})/i,
  // "Season 2 - Episode 161" or "Season 2 Episode 3"
  /^(.+?)[\s.]*Season\s*(\d{1,2})[\s.*-]*Episode\s*(\d{1,4})/i,
  // "Show Name E13" (E followed by 2-3 digits, no S prefix)
  /^(.+?)[\s.]+E(\d{2,3})(?:\b|[\s.])/i,
];

function classifyItem(item) {
  const url = item.url.toLowerCase();
  const group = item.group.toLowerCase();
  const name = item.name;

  // Live streams: not MP4/MKV
  if (!url.endsWith('.mp4') && !url.endsWith('.mkv') && !url.includes('/movie/') && !url.includes('/series/')) {
    if (!group.includes('vod') && !group.includes('movie') && !group.includes('series')) {
      return { type: 'live', seriesName: null, season: null, episode: null };
    }
  }

  // Try to detect episode patterns in the name
  for (const pattern of EPISODE_PATTERNS) {
    const match = name.match(pattern);
    if (match) {
      let seriesName = match[1].replace(/[.\-_]+$/, '').replace(/\./g, ' ').trim();
      // For 2-group match (no season), default to season 1
      const season = match[3] !== undefined ? parseInt(match[2]) : 1;
      const episode = match[3] !== undefined ? parseInt(match[3]) : parseInt(match[2]);

      if (seriesName) {
        return { type: 'series', seriesName, season, episode };
      }
    }
  }

  // Group name hints
  if (group.includes('series') || group.includes('episode')) {
    return { type: 'series', seriesName: null, season: null, episode: null };
  }

  // Default: VOD (movie)
  return { type: 'vod', seriesName: null, season: null, episode: null };
}
