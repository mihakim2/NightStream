import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPlaylist, testPlaylist } from '../api/client.js';
import styles from './Setup.module.css';

export default function Setup() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('xtream');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  const [name, setName] = useState('');
  const [server, setServer] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setTestResult(null);
    try {
      const data = tab === 'xtream'
        ? { type: 'xtream', server, username, password }
        : { type: 'm3u', url: m3uUrl };
      const result = await testPlaylist(data);
      setTestResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = tab === 'xtream'
        ? { type: 'xtream', name: name || 'My IPTV', server, username, password }
        : { type: 'm3u', name: name || 'My Playlist', url: m3uUrl };
      await addPlaylist(data);
      navigate('/live');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>▶</span>
          <h1 className={styles.title}>NightStream</h1>
          <p className={styles.subtitle}>Add your playlist to get started</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'xtream' ? styles.activeTab : ''}`} onClick={() => setTab('xtream')}>Xtream Codes</button>
          <button className={`${styles.tab} ${tab === 'm3u' ? styles.activeTab : ''}`} onClick={() => setTab('m3u')}>M3U URL</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Playlist Name</label>
            <input type="text" placeholder="My IPTV" value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
          </div>

          {tab === 'xtream' ? (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Server URL</label>
                <input type="url" placeholder="http://provider.com:8080" value={server} onChange={(e) => setServer(e.target.value)} required className={styles.input} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <input type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required className={styles.input} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <label className={styles.label}>M3U Playlist URL</label>
              <input type="url" placeholder="http://provider.com/playlist.m3u" value={m3uUrl} onChange={(e) => setM3uUrl(e.target.value)} required className={styles.input} />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          {testResult && testResult.ok && <div className={styles.success}>Connection successful!</div>}

          <div className={styles.actions}>
            <button type="button" onClick={handleTest} disabled={testing} className={styles.testBtn}>{testing ? 'Testing...' : 'Test Connection'}</button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? 'Adding...' : 'Add Playlist'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
