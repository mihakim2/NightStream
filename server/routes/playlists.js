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

router.post('/refresh', async (req, res) => {
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
