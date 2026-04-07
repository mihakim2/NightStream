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

export const getPlaylists = () => request('/api/playlists');
export const addPlaylist = (data) => request('/api/playlists', { method: 'POST', body: JSON.stringify(data) });
export const removePlaylist = (id) => request(`/api/playlists/${id}`, { method: 'DELETE' });
export const activatePlaylist = (id) => request(`/api/playlists/${id}/activate`, { method: 'POST' });
export const testPlaylist = (data) => request('/api/playlists/test', { method: 'POST', body: JSON.stringify(data) });

export const getLiveCategories = () => request('/api/live/categories');
export const getLiveChannels = (category) => request(`/api/live/channels${category ? `?category=${category}` : ''}`);

export const getVodCategories = () => request('/api/vod/categories');
export const getVodMovies = (category) => request(`/api/vod/movies${category ? `?category=${category}` : ''}`);

export const getSeriesCategories = () => request('/api/series/categories');
export const getSeriesList = (category) => request(`/api/series${category ? `?category=${category}` : ''}`);
export const getSeriesDetail = (id) => request(`/api/series/${id}`);

export const getEpgForChannel = (channelId) => request(`/api/epg/${channelId}`);
export const getEpgGrid = () => request('/api/epg/grid');

export const searchAll = (q) => request(`/api/search?q=${encodeURIComponent(q)}`);

export const getFavorites = () => request('/api/favorites');
export const toggleFavorite = (type, id) => request('/api/favorites', { method: 'POST', body: JSON.stringify({ type, id }) });

export const getSettings = () => request('/api/settings');
export const updateSettings = (data) => request('/api/settings', { method: 'PUT', body: JSON.stringify(data) });

export const proxyUrl = (url) => `/api/proxy/stream?url=${encodeURIComponent(url)}`;
