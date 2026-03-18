import { motion } from 'motion/react';
import { INTEREST_AREAS } from '@/data/interestAreas';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface InterestsStepProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
}

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 5;

export const InterestsStep = ({ selectedInterests, onChange }: InterestsStepProps) => {
  const [selected, setSelected] = useState<string[]>(selectedInterests);

  useEffect(() => {
    setSelected(selectedInterests);
  }, [selectedInterests]);

  const handleToggle = (key: string) => {
    let newSelected: string[];

    if (selected.includes(key)) {
      // Deselect
      newSelected = selected.filter(k => k !== key);
    } else {
      // Select (only if under max)
      if (selected.length >= MAX_INTERESTS) {
        return; // Don't allow more than max
      }
      newSelected = [...selected, key];
    }

    setSelected(newSelected);
    onChange(newSelected);
  };

  const isAtMax = selected.length >= MAX_INTERESTS;
  const isAtMin = selected.length >= MIN_INTERESTS;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold"
        >
          What excites you?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          Choose 3 to 5 areas — you can always change these later
        </motion.p>
      </div>

      {/* Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center"
      >
        <div
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
            isAtMin
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <span className="font-semibold">{selected.length}</span>
          <span>of</span>
          <span className="font-semibold">{MAX_INTERESTS}</span>
          <span>selected</span>
        </div>
        {!isAtMin && (
          <p className="text-sm text-muted-foreground mt-2">
            Pick at least {MIN_INTERESTS - selected.length} more
          </p>
        )}
        {isAtMax && (
          <p className="text-sm text-muted-foreground mt-2">
            Maximum {MAX_INTERESTS} selected
          </p>
        )}
      </motion.div>

      {/* Interest Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto"
      >
        {INTEREST_AREAS.map((interest, index) => {
          const isSelected = selected.includes(interest.key);
          const isDisabled = !isSelected && isAtMax;

          return (
            <motion.button
              key={interest.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
              onClick={() => handleToggle(interest.key)}
              disabled={isDisabled}
              className={cn(
                'group relative p-4 rounded-xl border-2 transition-all duration-300',
                'hover:scale-[1.02] active:scale-[0.98]',
                'text-left space-y-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : isDisabled
                  ? 'border-border bg-card opacity-50 cursor-not-allowed'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
              )}
              aria-pressed={isSelected}
              role="checkbox"
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg
                    className="h-4 w-4 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Icon */}
              <div className="text-3xl">{interest.icon}</div>

              {/* Label */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm leading-tight">{interest.name}</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {interest.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
