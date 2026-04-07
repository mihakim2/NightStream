import { useState, useCallback, useEffect } from 'react';
import { getSettings } from '../api/client.js';

export function useParental() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [settings, setSettings] = useState({
    parentalPin: null,
    parentalKeywords: ['adult', '18+', 'xxx', 'for adults'],
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinResolver, setPinResolver] = useState(null);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(prev => ({
        ...prev,
        parentalPin: s.parentalPin || null,
        parentalKeywords: s.parentalKeywords || prev.parentalKeywords,
      }));
    }).catch(() => {});
  }, []);

  const isRestricted = useCallback((categoryName) => {
    if (!settings.parentalPin) return false;
    if (!categoryName) return false;
    const lower = categoryName.toLowerCase();
    return settings.parentalKeywords.some(kw => lower.includes(kw.toLowerCase()));
  }, [settings]);

  const requirePin = useCallback(() => {
    if (!settings.parentalPin || isUnlocked) return Promise.resolve(true);
    return new Promise((resolve) => {
      setPinResolver(() => resolve);
      setShowPinModal(true);
    });
  }, [settings.parentalPin, isUnlocked]);

  const verifyPin = useCallback(async (pin) => {
    const res = await fetch('/api/settings/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.ok) {
      setIsUnlocked(true);
      setShowPinModal(false);
      if (pinResolver) pinResolver(true);
      setPinResolver(null);
      return true;
    }
    return false;
  }, [pinResolver]);

  const dismissPin = useCallback(() => {
    setShowPinModal(false);
    if (pinResolver) pinResolver(false);
    setPinResolver(null);
  }, [pinResolver]);

  const lock = useCallback(() => setIsUnlocked(false), []);

  const refreshSettings = useCallback(() => {
    getSettings().then(s => {
      setSettings(prev => ({
        ...prev,
        parentalPin: s.parentalPin || null,
        parentalKeywords: s.parentalKeywords || prev.parentalKeywords,
      }));
    }).catch(() => {});
  }, []);

  return {
    isRestricted,
    isUnlocked,
    requirePin,
    verifyPin,
    dismissPin,
    lock,
    showPinModal,
    refreshSettings,
    settings,
  };
}
