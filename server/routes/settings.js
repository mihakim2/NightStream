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
