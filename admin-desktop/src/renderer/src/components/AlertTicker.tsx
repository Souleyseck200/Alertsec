import React, { useEffect, useRef, useState } from 'react';
import { TickerEvent } from '../types';

interface AlertTickerProps { events: TickerEvent[]; }

const AlertTicker: React.FC<AlertTickerProps> = ({ events }) => {
  const [displayIdx, setDisplayIdx] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;
    setDisplayIdx(0);
    const interval = setInterval(() => {
      setDisplayIdx(i => (i + 1) % events.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-[999] max-w-2xl w-full px-4">
      <div className="glass-panel rounded-full px-5 py-2 flex items-center gap-3 border border-white/5 overflow-hidden">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 shrink-0">Tactique</span>
        <div className="w-px h-3 bg-white/10 shrink-0" />
        <div className="flex-1 overflow-hidden relative h-4">
          <p
            key={displayIdx}
            className="absolute text-[11px] text-gray-300 font-medium whitespace-nowrap animate-ticker-slide"
          >
            {events[displayIdx]?.message}
          </p>
        </div>
        <span className="text-[9px] text-gray-600 shrink-0 font-mono">
          {events[displayIdx] ? new Date(events[displayIdx].time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    </div>
  );
};

export default AlertTicker;
