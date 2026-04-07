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
  parentalPin: null,
  parentalKeywords: ['adult', '18+', 'xxx', 'for adults'],
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

router.post('/verify-pin', async (req, res) => {
  const { pin } = req.body || {};
  const settings = await readStore('settings.json', DEFAULT_SETTINGS);
  if (!settings.parentalPin) {
    return res.json({ ok: true });
  }
  res.json({ ok: String(pin) === String(settings.parentalPin) });
});

export default router;
