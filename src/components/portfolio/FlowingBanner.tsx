import React from 'react';
import './FlowingBanner.css';

export interface FlowingBannerItem {
  text: string;
  image?: string;
}

interface FlowingBannerProps {
  items: FlowingBannerItem[];
  tone?: 'completed' | 'uncompleted' | 'in-progress';
  className?: string;
  visible?: boolean;
  durationSec?: number; // animation duration; lower = faster
  direction?: 'ltr' | 'rtl';
  appearDelayMs?: number;
}

/**
 * FlowingBanner is a narrow marquee ribbon that animates into view on hover.
 * It is designed to sit beneath a card, with pointer-events disabled so the
 * parent remains interactive. The banner uses a single row of repeated items.
 */
export default function FlowingBanner({ items = [], tone = 'in-progress', className, visible = true, durationSec = 22, direction = 'ltr', appearDelayMs = 140 }: FlowingBannerProps) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  // Repeat content to fill the track smoothly
  const repeated = Array.from({ length: 8 }).map((_, idx) => (
    <React.Fragment key={idx}>
      {items.map((item, i) => (
        <React.Fragment key={`${idx}-${i}`}>
          {item.text ? <span>{item.text}</span> : null}
          {item.image ? <div className="marquee__img" style={{ backgroundImage: `url(${item.image})` }} /> : null}
        </React.Fragment>
      ))}
    </React.Fragment>
  ));

  return (
    <div
      className={`banner-surface ${tone} ${visible ? 'is-visible' : ''} ${className || ''}`}
      style={{ ['--banner-appear-delay' as any]: `${appearDelayMs}ms` }}
    >
      <div className="marquee" style={{ ['--banner-duration' as any]: `${durationSec}s` }}>
        <div className={`marquee__inner ${direction === 'rtl' ? 'rtl' : 'ltr'}`} ref={trackRef} aria-hidden="true">
          {repeated}
        </div>
      </div>
    </div>
  );
}


