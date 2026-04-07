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
  const stored = await readStore('settings.json', {});
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  res.json(settings);
});

const ALLOWED_KEYS = ['activePlaylistId', 'epgUrl', 'playerDefaults', 'parentalPin', 'parentalKeywords'];

router.put('/', async (req, res) => {
  const current = await readStore('settings.json', DEFAULT_SETTINGS);
  const updates = {};
  for (const key of ALLOWED_KEYS) {
    if (key in req.body) updates[key] = req.body[key];
  }
  const updated = { ...current, ...updates };
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
