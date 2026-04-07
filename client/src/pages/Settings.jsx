import React, { useState, useContext } from 'react';
import { useApi } from '../hooks/useApi.js';
import { getPlaylists, removePlaylist, activatePlaylist, updateSettings, getSettings } from '../api/client.js';
import { ParentalContext } from '../App.jsx';
import styles from './Settings.module.css';

export default function Settings() {
  const { data: playlistData, reload: reloadPlaylists } = useApi(() => getPlaylists(), []);
  const { data: settings, reload: reloadSettings } = useApi(() => getSettings(), []);
  const [epgUrl, setEpgUrl] = useState('');
  const [saved, setSaved] = useState(false);

  // Parental control local state
  const parental = useContext(ParentalContext);
  const [newPin, setNewPin] = useState('');
  const [pinSaved, setPinSaved] = useState(false);
  const [pinError, setPinError] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordSaved, setKeywordSaved] = useState(false);

  React.useEffect(() => {
    if (settings?.epgUrl) setEpgUrl(settings.epgUrl);
  }, [settings]);

  const handleRemovePlaylist = async (id) => { await removePlaylist(id); reloadPlaylists(); };
  const handleActivate = async (id) => { await activatePlaylist(id); reloadPlaylists(); window.location.reload(); };

  const handleSaveSettings = async () => {
    await updateSettings({ epgUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reloadSettings();
  };

  const handleSavePin = async () => {
    setPinError('');
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    await updateSettings({ parentalPin: newPin });
    setNewPin('');
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
    reloadSettings();
    parental?.refreshSettings();
  };

  const handleRemovePin = async () => {
    await updateSettings({ parentalPin: null });
    reloadSettings();
    parental?.refreshSettings();
    parental?.lock();
  };

  const currentKeywords = settings?.parentalKeywords || ['adult', '18+', 'xxx', 'for adults'];
  const hasPin = !!settings?.parentalPin;

  const handleAddKeyword = async () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    const updated = [...new Set([...currentKeywords, kw])];
    await updateSettings({ parentalKeywords: updated });
    setNewKeyword('');
    setKeywordSaved(true);
    setTimeout(() => setKeywordSaved(false), 1500);
    reloadSettings();
    parental?.refreshSettings();
  };

  const handleRemoveKeyword = async (kw) => {
    const updated = currentKeywords.filter(k => k !== kw);
    await updateSettings({ parentalKeywords: updated });
    reloadSettings();
    parental?.refreshSettings();
  };

  const playlists = playlistData?.playlists || [];
  const activeId = playlistData?.activePlaylistId;

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Settings</h2>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Playlists</h3>
        <div className={styles.playlists}>
          {playlists.map(p => (
            <div key={p.id} className={`${styles.playlistItem} ${p.id === activeId ? styles.activePl : ''}`}>
              <div className={styles.plInfo}>
                <div className={styles.plName}>{p.name}{p.id === activeId && <span className={styles.activeBadge}>Active</span>}</div>
                <div className={styles.plType}>{p.type === 'xtream' ? 'Xtream Codes' : 'M3U URL'}</div>
              </div>
              <div className={styles.plActions}>
                {p.id !== activeId && <button className={styles.actionBtn} onClick={() => handleActivate(p.id)}>Activate</button>}
                <button className={styles.dangerBtn} onClick={() => handleRemovePlaylist(p.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={() => window.location.href = '/setup'}>+ Add Playlist</button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>EPG Source</h3>
        <p className={styles.hint}>Override the default EPG URL. Leave empty to use your provider's EPG.</p>
        <div className={styles.fieldRow}>
          <input type="url" placeholder="http://epg-provider.com/xmltv.xml" value={epgUrl} onChange={(e) => setEpgUrl(e.target.value)} className={styles.input} />
          <button className={styles.saveBtn} onClick={handleSaveSettings}>{saved ? 'Saved!' : 'Save'}</button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Parental Controls</h3>
        <p className={styles.hint}>
          Set a 4-digit PIN to lock categories containing adult content keywords.
          {hasPin ? ' PIN is currently enabled.' : ' No PIN set — parental controls are disabled.'}
        </p>

        <div className={styles.pinRow}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder={hasPin ? 'New PIN (4 digits)' : 'Set PIN (4 digits)'}
            value={newPin}
            onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
            className={styles.pinInput}
          />
          <button className={styles.saveBtn} onClick={handleSavePin}>
            {pinSaved ? 'Saved!' : hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
          {hasPin && (
            <button className={styles.dangerBtn} onClick={handleRemovePin}>Remove PIN</button>
          )}
        </div>
        {pinError && <p className={styles.pinError}>{pinError}</p>}

        <div className={styles.keywordsSection}>
          <p className={styles.hint} style={{ marginBottom: 8 }}>Restricted keywords (case-insensitive match on category name):</p>
          <div className={styles.keywordList}>
            {currentKeywords.map(kw => (
              <span key={kw} className={styles.keyword}>
                {kw}
                <button className={styles.kwRemove} onClick={() => handleRemoveKeyword(kw)} title="Remove">×</button>
              </span>
            ))}
          </div>
          <div className={styles.fieldRow} style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="Add keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              className={styles.input}
            />
            <button className={styles.saveBtn} onClick={handleAddKeyword}>
              {keywordSaved ? 'Added!' : 'Add'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.about}>Astra v1.0.0 — A locally-run browser-based IPTV player.</p>
      </section>
    </div>
  );
}
