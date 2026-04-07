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
