import { Router } from 'express';
import { fetchAndParseEpg, getCurrentProgram, getNextProgram } from '../services/epg-engine.js';
import { readStore } from '../services/store.js';
import { getActivePlaylist, getXtreamClient } from '../services/playlist-manager.js';

const router = Router();

async function getEpgUrl() {
  const settings = await readStore('settings.json', {});
  if (settings.epgUrl) return settings.epgUrl;

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
