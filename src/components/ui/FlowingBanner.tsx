import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './FlowingBanner.css';

interface FlowingBannerProps {
  isCompleted: boolean;
  sectionId: string;
  completionMessage?: string;
  isHovered: boolean;
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

const FlowingBanner = ({ isCompleted, sectionId, completionMessage, isHovered }: FlowingBannerProps) => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  useEffect(() => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;

    if (isHovered) {
      // Slide in from bottom
      gsap
        .timeline({ defaults: animationDefaults })
        .set(marqueeRef.current, { y: '101%' }, 0)
        .set(marqueeInnerRef.current, { y: '-101%' }, 0)
        .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
    } else {
      // Slide out to bottom
      gsap
        .timeline({ defaults: animationDefaults })
        .to(marqueeRef.current, { y: '101%' }, 0)
        .to(marqueeInnerRef.current, { y: '-101%' }, 0);
    }
  }, [isHovered]);

  const message = completionMessage || COMPLETION_MESSAGES[sectionId] || (isCompleted ? 'Complete!' : 'Uncompleted');
  
  // Decorative icons based on completion status
  const icons = isCompleted ? ['🏆', '⭐', '✨'] : ['🔒', '⏳'];

  // Repeat message 8 times with alternating icons for marquee effect
  const repeatedContent = Array.from({ length: 8 }).map((_, idx) => (
    <span key={idx} className="flowing-banner__text">
      {message}
      <span className="flowing-banner__icon">{icons[idx % icons.length]}</span>
    </span>
  ));

  return (
    <div 
      className={`flowing-banner ${isCompleted ? 'flowing-banner--completed' : 'flowing-banner--uncompleted'}`}
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
