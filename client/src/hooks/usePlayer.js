import { useState, useCallback, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { proxyUrl } from '../api/client.js';

export function usePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const play = useCallback((item) => {
    setCurrentItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setIsOpen(false);
    setCurrentItem(null);
  }, []);

  const attachVideo = useCallback((videoElement) => {
    videoRef.current = videoElement;
    if (!videoElement || !currentItem) return;

    const streamUrl = proxyUrl(currentItem.url);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentItem.url.includes('.m3u8') || currentItem.url.includes('/live/')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr, url) => {},
        });
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
    } else {
      videoElement.src = streamUrl;
      videoElement.play().catch(() => {});
    }
  }, [currentItem]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  return { isOpen, currentItem, play, close, attachVideo, hlsRef, videoRef };
}
