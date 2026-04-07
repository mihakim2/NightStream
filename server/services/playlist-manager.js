import { readStore, writeStore } from './store.js';
import { parseM3U } from './playlist-parser.js';
import { XtreamClient } from './xtream-client.js';
import crypto from 'crypto';

const cache = {
  playlists: {},
  clients: {},
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
    type: config.type,
    url: config.url || '',
    server: config.server || '',
    username: config.username || '',
    password: config.password || '',
    createdAt: Date.now(),
  };
  data.playlists.push(playlist);
  await writeStore('playlists.json', data);

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
  const seriesEpisodes = items.filter(i => i.type === 'series');

  const extractCategories = (items) => {
    const groups = [...new Set(items.map(i => i.group))];
    return groups.map((g) => ({ id: g, name: g }));
  };

  // Group episodes into series objects with seasons
  const seriesMap = new Map(); // key: "group|||seriesName" -> series object

  for (const ep of seriesEpisodes) {
    const seriesKey = `${ep.group}|||${(ep.seriesName || ep.name).toLowerCase()}`;

    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, {
        id: `series-${seriesMap.size}`,
        name: ep.seriesName || ep.name,
        logo: ep.logo || '',
        group: ep.group,
        plot: '',
        rating: '',
        year: '',
        seasons: {},
      });
    }

    const series = seriesMap.get(seriesKey);
    // Use first episode's logo as series logo if we don't have one
    if (!series.logo && ep.logo) series.logo = ep.logo;

    const seasonNum = String(ep.season || 1);
    if (!series.seasons[seasonNum]) series.seasons[seasonNum] = [];

    series.seasons[seasonNum].push({
      id: `ep-${seriesEpisodes.indexOf(ep)}`,
      episodeNum: ep.episode || series.seasons[seasonNum].length + 1,
      title: ep.name,
      plot: '',
      duration: '',
      logo: ep.logo || '',
      url: ep.url,
    });
  }

  // Sort episodes within each season
  for (const series of seriesMap.values()) {
    for (const seasonNum of Object.keys(series.seasons)) {
      series.seasons[seasonNum].sort((a, b) => a.episodeNum - b.episodeNum);
    }
  }

  const seriesList = [...seriesMap.values()];

  return {
    type: 'm3u',
    liveCategories: extractCategories(liveItems),
    vodCategories: extractCategories(vodItems),
    seriesCategories: extractCategories(seriesEpisodes),
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
    series: seriesList,
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
