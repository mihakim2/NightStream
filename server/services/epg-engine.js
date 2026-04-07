import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { readStore, writeStore } from './store.js';

let epgCache = null;
let lastFetch = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000;

export async function fetchAndParseEpg(url) {
  if (!url) return {};

  const now = Date.now();
  if (epgCache && (now - lastFetch) < CACHE_DURATION) {
    return epgCache;
  }

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
  const clean = str.replace(/\s.*$/, '');
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
