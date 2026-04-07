import React, { useContext } from 'react';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getEpgGrid, getLiveChannels } from '../api/client.js';
import EPGGrid from '../components/EPGGrid/EPGGrid.jsx';
import styles from './EPG.module.css';

export default function EPGPage() {
  const player = useContext(PlayerContext);
  const { data: schedule, loading: epgLoading } = useApi(() => getEpgGrid(), []);
  const { data: channels, loading: chLoading } = useApi(() => getLiveChannels(), []);

  const loading = epgLoading || chLoading;

  const handleProgramClick = (program, channel) => { player.play(channel); };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Program Guide</h2>
      {loading ? (
        <div className={styles.loading}>Loading EPG data...</div>
      ) : !schedule || Object.keys(schedule).length === 0 ? (
        <div className={styles.empty}>No EPG data available. Make sure your provider supports EPG or configure an XMLTV URL in Settings.</div>
      ) : (
        <EPGGrid schedule={schedule} channels={channels || []} onProgramClick={handleProgramClick} />
      )}
    </div>
  );
}
