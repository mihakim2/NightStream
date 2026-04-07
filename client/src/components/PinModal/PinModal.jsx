import React, { useState, useRef, useEffect } from 'react';
import styles from './PinModal.module.css';

export default function PinModal({ onVerify, onDismiss }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = async (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (value && index === 3) {
      const pin = [...newDigits.slice(0, 3), value].join('');
      if (pin.length === 4) {
        await submitPin(pin, newDigits);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      const pin = digits.join('');
      if (pin.length === 4) submitPin(pin, digits);
    }
  };

  const submitPin = async (pin, currentDigits) => {
    setLoading(true);
    const ok = await onVerify(pin);
    setLoading(false);
    if (!ok) {
      setError(true);
      setShaking(true);
      setDigits(['', '', '', '']);
      setTimeout(() => {
        setShaking(false);
        inputRefs[0].current?.focus();
      }, 600);
    }
  };

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div
        className={`${styles.modal} ${shaking ? styles.shake : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.lockIcon}>🔒</div>
        <h2 className={styles.title}>Parental Control</h2>
        <p className={styles.subtitle}>Enter PIN to access restricted content</p>

        <div className={styles.digitRow}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              className={`${styles.digitBox} ${error ? styles.digitError : ''} ${d ? styles.digitFilled : ''}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              autoComplete="off"
            />
          ))}
        </div>

        {error && <p className={styles.errorMsg}>Incorrect PIN. Please try again.</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onDismiss} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={() => submitPin(digits.join(''), digits)}
            disabled={loading || digits.join('').length < 4}
          >
            {loading ? 'Checking...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
