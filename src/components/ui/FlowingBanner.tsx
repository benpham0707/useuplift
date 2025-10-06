import React, { useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import './FlowingBanner.css';

interface FlowingBannerProps {
  isCompleted: boolean;
  sectionId: string;
  completionMessage?: string;
}

// Section-specific completion messages
const COMPLETION_MESSAGES: Record<string, string> = {
  'personal-info': 'Profile Foundation Complete! 🎯',
  'academic-journey': 'Academic Excellence Documented! 📚',
  'experiences': 'Leadership Portfolio Complete! ⭐',
  'family': 'Context & Resilience Captured! 💪',
  'goals': 'Future Vision Defined! 🚀',
  'support': 'Network of Champions Built! 🤝',
  'growth': 'Your Story Has Power! ✨'
};

const FlowingBanner = ({ isCompleted, sectionId, completionMessage }: FlowingBannerProps) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  const handleMouseEnter = useCallback((ev: React.MouseEvent) => {
    if (!bannerRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
  }, []);

  const handleMouseLeave = useCallback((ev: React.MouseEvent) => {
    if (!bannerRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  }, []);

  const message = completionMessage || COMPLETION_MESSAGES[sectionId] || (isCompleted ? 'Complete!' : 'Uncompleted');

  // Repeat message 6 times for marquee effect
  const repeatedContent = Array.from({ length: 6 }).map((_, idx) => (
    <span key={idx} className="flowing-banner__text">
      {message}
    </span>
  ));

  return (
    <div 
      className={`flowing-banner ${isCompleted ? 'flowing-banner--completed' : 'flowing-banner--uncompleted'}`}
      ref={bannerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flowing-banner__marquee" ref={marqueeRef}>
        <div className="flowing-banner__marquee-inner-wrap" ref={marqueeInnerRef}>
          <div className="flowing-banner__marquee-inner" aria-hidden="true">
            {repeatedContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowingBanner;
