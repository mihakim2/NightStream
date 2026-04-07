import React, { useRef, useEffect, useMemo } from 'react';
import styles from './EPGGrid.module.css';

const SLOT_WIDTH = 180;
const ROW_HEIGHT = 56;
const HOURS_TO_SHOW = 6;

export default function EPGGrid({ schedule, channels, onProgramClick }) {
  const scrollRef = useRef(null);
  const now = Date.now();
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - 1, 0, 0, 0);
  const gridStart = startTime.getTime();
  const gridEnd = gridStart + HOURS_TO_SHOW * 60 * 60 * 1000;

  useEffect(() => {
    if (scrollRef.current) {
      const offsetMinutes = (now - gridStart) / 60000;
      const offsetPx = (offsetMinutes / 30) * SLOT_WIDTH - 200;
      scrollRef.current.scrollLeft = Math.max(0, offsetPx);
    }
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let t = gridStart; t < gridEnd; t += 30 * 60 * 1000) { slots.push(t); }
    return slots;
  }, [gridStart, gridEnd]);

  const totalWidth = timeSlots.length * SLOT_WIDTH;
  const nowOffset = ((now - gridStart) / 60000 / 30) * SLOT_WIDTH;

  return (
    <div className={styles.container}>
      <div className={styles.channelList}>
        <div className={styles.timeHeader} />
        {channels.map(ch => (
          <div key={ch.id} className={styles.channelRow}>
            <div className={styles.channelName}>{ch.name}</div>
          </div>
        ))}
      </div>
      <div className={styles.gridScroll} ref={scrollRef}>
        <div className={styles.timeRow} style={{ width: totalWidth }}>
          {timeSlots.map(t => (
            <div key={t} className={styles.timeSlot} style={{ width: SLOT_WIDTH }}>
              {new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          ))}
        </div>
        <div className={styles.gridBody} style={{ width: totalWidth }}>
          {channels.map(ch => {
            const programs = schedule[ch.epgChannelId] || schedule[ch.id] || [];
            return (
              <div key={ch.id} className={styles.programRow} style={{ height: ROW_HEIGHT }}>
                {programs.filter(p => p.stop > gridStart && p.start < gridEnd).map((prog, idx) => {
                  const left = Math.max(0, ((prog.start - gridStart) / 60000 / 30) * SLOT_WIDTH);
                  const right = Math.min(totalWidth, ((prog.stop - gridStart) / 60000 / 30) * SLOT_WIDTH);
                  const width = right - left;
                  const isNow = prog.start <= now && prog.stop > now;
                  return (
                    <div key={idx} className={`${styles.program} ${isNow ? styles.programNow : ''}`} style={{ left, width: Math.max(width, 2) }} onClick={() => onProgramClick?.(prog, ch)} title={prog.title}>
                      <span className={styles.programTitle}>{prog.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div className={styles.nowLine} style={{ left: nowOffset }} />
        </div>
      </div>
    </div>
  );
}
