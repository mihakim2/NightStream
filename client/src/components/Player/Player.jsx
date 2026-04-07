import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';
import { PlayerContext } from '../../App.jsx';
import styles from './Player.module.css';

export default function Player() {
  const { isOpen, currentItem, close, attachVideo, hlsRef } = useContext(PlayerContext);
  const videoRef = useRef(null);
  const seekBarRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('fit');

  const aspectRatios = ['fit', 'fill', '16:9', '4:3'];
  const isSeekable = duration && isFinite(duration) && duration > 0;

  useEffect(() => {
    if (isOpen && videoRef.current) {
      attachVideo(videoRef.current);
    }
  }, [isOpen, currentItem, attachVideo]);

  useEffect(() => {
    if (!hlsRef?.current) return;
    const hls = hlsRef.current;
    const onAudioTracks = () => { setAudioTracks(hls.audioTracks || []); };
    hls.on('hlsAudioTracksUpdated', onAudioTracks);
    return () => hls.off('hlsAudioTracksUpdated', onAudioTracks);
  }, [hlsRef, isOpen]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const skip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = video.currentTime + seconds;
    video.currentTime = Math.max(0, isFinite(video.duration) ? Math.min(newTime, video.duration) : newTime);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      resetControlsTimer();
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case ' ': e.preventDefault(); video.paused ? video.play() : video.pause(); break;
        case 'ArrowLeft': skip(-10); break;
        case 'ArrowRight': skip(10); break;
        case 'ArrowUp': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); setVolume(video.volume); break;
        case 'ArrowDown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); setVolume(video.volume); break;
        case 'f': document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen?.(); break;
        case 'm': video.muted = !video.muted; setIsMuted(video.muted); break;
        case 'Escape': close(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close, resetControlsTimer, skip]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setIsPlaying(!video.paused);
    }
  };

  const seekToPosition = useCallback((clientX) => {
    const video = videoRef.current;
    const bar = seekBarRef.current;
    if (!video || !bar) return;
    const videoDuration = video.duration;
    if (!videoDuration || !isFinite(videoDuration) || videoDuration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pct * videoDuration;
  }, []);

  const handleSeekMouseDown = useCallback((e) => {
    seekToPosition(e.clientX);
    const onMove = (ev) => {
      ev.preventDefault();
      seekToPosition(ev.clientX);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [seekToPosition]);

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const cycleAspectRatio = () => {
    const idx = aspectRatios.indexOf(aspectRatio);
    setAspectRatio(aspectRatios[(idx + 1) % aspectRatios.length]);
  };

  const changeAudioTrack = (idx) => {
    if (hlsRef?.current) { hlsRef.current.audioTrack = idx; }
    setSelectedAudioTrack(idx);
  };

  const getVideoStyle = () => {
    switch (aspectRatio) {
      case 'fill': return { objectFit: 'cover' };
      case '16:9': return { objectFit: 'contain', aspectRatio: '16/9' };
      case '4:3': return { objectFit: 'contain', aspectRatio: '4/3' };
      default: return { objectFit: 'contain' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseMove={resetControlsTimer}>
      <video
        ref={videoRef}
        className={styles.video}
        style={getVideoStyle()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={() => { const video = videoRef.current; video?.paused ? video.play() : video.pause(); }}
      />

      <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
        <div className={styles.topBar}>
          <div className={styles.nowPlaying}>{currentItem?.name || ''}</div>
          <button className={styles.closeBtn} onClick={close}>✕</button>
        </div>

        <div className={styles.bottomBar}>
          {isSeekable && (
            <div className={styles.seekBar} ref={seekBarRef} onMouseDown={handleSeekMouseDown}>
              <div className={styles.seekFill} style={{ width: `${(currentTime / duration) * 100}%` }} />
            </div>
          )}

          <div className={styles.controlsRow}>
            {/* Skip back 10s */}
            <button className={styles.controlBtn} onClick={() => skip(-10)} title="Back 10s">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.5 8L8 12l4.5 4" />
                <path d="M3 12a9 9 0 1 0 9-9" />
                <text x="12" y="13.5" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">10</text>
              </svg>
            </button>

            {/* Play/Pause */}
            <button className={`${styles.controlBtn} ${styles.playPauseBtn}`} onClick={() => { const video = videoRef.current; video?.paused ? video.play() : video.pause(); }}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Skip forward 10s */}
            <button className={styles.controlBtn} onClick={() => skip(10)} title="Forward 10s">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11.5 8L16 12l-4.5 4" />
                <path d="M21 12a9 9 0 1 0-9-9" />
                <text x="12" y="13.5" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">10</text>
              </svg>
            </button>

            <span className={styles.time}>
              {formatTime(currentTime)}{isSeekable ? ` / ${formatTime(duration)}` : ''}
            </span>

            <div className={styles.spacer} />

            <div className={styles.volumeControl}>
              <button className={styles.controlBtn} onClick={() => { const video = videoRef.current; if (video) { video.muted = !video.muted; setIsMuted(!isMuted); } }}>
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className={styles.volumeSlider} />
            </div>

            {audioTracks.length > 1 && (
              <select className={styles.trackSelect} value={selectedAudioTrack} onChange={(e) => changeAudioTrack(parseInt(e.target.value))}>
                {audioTracks.map((track, idx) => (
                  <option key={idx} value={idx}>🔈 {track.name || track.lang || `Track ${idx + 1}`}</option>
                ))}
              </select>
            )}

            <button className={styles.controlBtn} onClick={cycleAspectRatio}>
              {aspectRatio === 'fit' ? '⬜' : aspectRatio === 'fill' ? '⬛' : aspectRatio}
            </button>

            <button className={styles.controlBtn} onClick={() => { const video = videoRef.current; document.fullscreenElement ? document.exitFullscreen() : video?.requestFullscreen?.(); }}>
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
