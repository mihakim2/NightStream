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
  const [playError, setPlayError] = useState(null);

  const aspectRatios = ['fit', 'fill', '16:9', '4:3'];
  const isSeekable = duration && isFinite(duration) && duration > 0;

  useEffect(() => {
    if (isOpen && videoRef.current) {
      setPlayError(null);
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
        case 'ArrowLeft': skip(-30); break;
        case 'ArrowRight': skip(30); break;
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

  // Double-tap left/right side of video to skip, single tap to play/pause
  const tapTimerRef = useRef(null);
  const tapCountRef = useRef(0);
  const [skipIndicator, setSkipIndicator] = useState(null); // 'left' | 'right' | null

  const handleVideoClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const zone = x < rect.width * 0.3 ? 'left' : x > rect.width * 0.7 ? 'right' : 'center';

    tapCountRef.current++;

    if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          // Single tap — play/pause
          const video = videoRef.current;
          video?.paused ? video.play() : video.pause();
        }
        tapCountRef.current = 0;
      }, 250);
    } else if (tapCountRef.current === 2) {
      clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      // Double tap — skip based on side
      if (zone === 'left') {
        skip(-30);
        setSkipIndicator('left');
        setTimeout(() => setSkipIndicator(null), 600);
      } else if (zone === 'right') {
        skip(30);
        setSkipIndicator('right');
        setTimeout(() => setSkipIndicator(null), 600);
      } else {
        // Double tap center — fullscreen toggle
        const video = videoRef.current;
        document.fullscreenElement ? document.exitFullscreen() : video?.requestFullscreen?.();
      }
    }
  }, [skip]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseMove={resetControlsTimer}>
      <video
        ref={videoRef}
        className={styles.video}
        style={getVideoStyle()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => { setIsPlaying(true); setPlayError(null); }}
        onPause={() => setIsPlaying(false)}
        onError={() => setPlayError('This stream is unavailable. The provider\'s server may be down.')}
        onClick={handleVideoClick}
      />

      {playError && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorIcon}>!</div>
          <div className={styles.errorText}>{playError}</div>
          <button className={styles.errorBtn} onClick={close}>Close</button>
        </div>
      )}

      {/* Skip indicators */}
      {skipIndicator === 'left' && (
        <div className={`${styles.skipIndicator} ${styles.skipLeft}`}>
          <span className={styles.skipIcon}>⟲</span>
          <span className={styles.skipText}>30s</span>
        </div>
      )}
      {skipIndicator === 'right' && (
        <div className={`${styles.skipIndicator} ${styles.skipRight}`}>
          <span className={styles.skipIcon}>⟳</span>
          <span className={styles.skipText}>30s</span>
        </div>
      )}

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
            <button className={styles.skipBtn} onClick={() => skip(-30)} title="Back 30s">
              <span className={styles.skipBtnIcon}>↺</span>
              <span className={styles.skipBtnLabel}>30</span>
            </button>

            <button className={`${styles.controlBtn} ${styles.playPauseBtn}`} onClick={() => { const video = videoRef.current; video?.paused ? video.play() : video.pause(); }}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button className={styles.skipBtn} onClick={() => skip(30)} title="Forward 30s">
              <span className={styles.skipBtnIcon}>↻</span>
              <span className={styles.skipBtnLabel}>30</span>
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
