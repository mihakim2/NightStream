import React from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({ width, height, radius, style }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width: width || '100%', height: height || '20px', borderRadius: radius || 'var(--radius-sm)', ...style }}
    />
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className={styles.channelCard}>
      <Skeleton width="48px" height="48px" radius="50%" />
      <div className={styles.channelInfo}>
        <Skeleton width="120px" height="14px" />
        <Skeleton width="180px" height="12px" />
        <Skeleton width="100%" height="4px" radius="2px" />
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className={styles.contentCard}>
      <Skeleton height="220px" radius="var(--radius-sm)" />
      <Skeleton width="80%" height="14px" style={{ marginTop: 10 }} />
      <Skeleton width="50%" height="12px" style={{ marginTop: 6 }} />
    </div>
  );
}
