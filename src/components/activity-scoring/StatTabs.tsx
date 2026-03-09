/**
 * StatTabs — Animated pill selector for Activity / Narrative tab switching.
 *
 * Uses framer-motion `layoutId` to slide a glowing gradient background
 * behind the active tab for a smooth HUD selector feel.
 */
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type StatTabType = 'activity' | 'narrative';

interface StatTabsProps {
  activeTab: StatTabType;
  onTabChange: (tab: StatTabType) => void;
  activeColorClass?: string;
}

const TABS: { id: StatTabType; label: string }[] = [
  { id: 'activity', label: 'Activity Strength' },
  { id: 'narrative', label: 'Narrative & Detail' },
];

export const StatTabs: React.FC<StatTabsProps> = ({
  activeTab,
  onTabChange,
  activeColorClass = 'from-[hsl(250,70%,60%)] via-[hsl(265,80%,63%)] to-[hsl(280,90%,65%)]',
}) => {
  return (
    <div className="relative inline-flex items-center gap-1 p-1 rounded-full border border-foreground/5 bg-foreground/5 backdrop-blur-md shadow-inner">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-6 py-2.5 rounded-full flex items-center justify-center z-10 transition-colors duration-300',
              isActive ? 'text-white' : 'text-foreground/40 hover:text-foreground/60',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabSlider"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={cn('absolute inset-0 rounded-full bg-gradient-to-r shadow-lg z-[-1]', activeColorClass)}
                style={{ filter: 'drop-shadow(0px 0px 8px hsl(250 70% 60% / 0.5))' }}
              />
            )}
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] relative transition-colors duration-300">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
