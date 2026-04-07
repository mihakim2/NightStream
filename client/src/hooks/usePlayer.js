import { useState, useCallback, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { proxyUrl } from '../api/client.js';

export function usePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const mpegtsRef = useRef(null);

  const play = useCallback((item) => {
    setCurrentItem(item);
    setIsOpen(true);
  }, []);

  const destroyPlayers = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      mpegtsRef.current.destroy();
      mpegtsRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    destroyPlayers();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setIsOpen(false);
    setCurrentItem(null);
  }, [destroyPlayers]);

  const attachVideo = useCallback((videoElement) => {
    videoRef.current = videoElement;
    if (!videoElement || !currentItem) return;

    destroyPlayers();

    const url = currentItem.url;
    const streamUrl = proxyUrl(url);

    const isHlsStream = url.endsWith('.m3u8');
    const isTsStream = url.endsWith('.ts');
    const isMp4Stream = url.endsWith('.mp4') || url.endsWith('.mkv');

    if (isHlsStream) {
      // HLS stream — use HLS.js
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch(() => {});
        });
        hlsRef.current = hls;
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = streamUrl;
        videoElement.play().catch(() => {});
      }
    } else if (isTsStream && mpegts.isSupported()) {
      // MPEG-TS stream — use mpegts.js
      const player = mpegts.createPlayer({
        type: 'mpegts',
        isLive: true,
        url: streamUrl,
      });
      player.attachMediaElement(videoElement);
      player.load();
      player.play().catch(() => {});
      mpegtsRef.current = player;
    } else {
      // MP4 or other — direct playback via proxy
      videoElement.src = streamUrl;
      videoElement.play().catch(() => {});
    }
  }, [currentItem, destroyPlayers]);

  useEffect(() => {
    return () => {
      destroyPlayers();
    };
  }, [destroyPlayers]);

  return { isOpen, currentItem, play, close, attachVideo, hlsRef, videoRef };
}
