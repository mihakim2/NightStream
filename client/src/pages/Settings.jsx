import React, { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { getPlaylists, removePlaylist, activatePlaylist, updateSettings, getSettings } from '../api/client.js';
import styles from './Settings.module.css';

export default function Settings() {
  const { data: playlistData, reload: reloadPlaylists } = useApi(() => getPlaylists(), []);
  const { data: settings, reload: reloadSettings } = useApi(() => getSettings(), []);
  const [epgUrl, setEpgUrl] = useState('');
  const [saved, setSaved] = useState(false);

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
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.about}>XtreamPlayer v1.0.0 — A locally-run browser-based IPTV player.</p>
      </section>
    </div>
  );
}
