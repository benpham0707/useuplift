import { motion } from 'motion/react';
import { AcademicPath } from '@/types/onboarding';
import { GraduationCap, School, Briefcase, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AcademicPathStepProps {
  firstName?: string;
  selectedPath?: AcademicPath;
  onNameChange: (name: string) => void;
  onSelect: (path: AcademicPath) => void;
}

interface PathOption {
  value: AcademicPath;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    value: 'high_school',
    icon: GraduationCap,
    label: 'High School Student',
    description: "I'm preparing for college",
  },
  {
    value: 'college',
    icon: School,
    label: 'College Student',
    description: "I'm in undergrad or community college",
  },
  {
    value: 'professional',
    icon: Briefcase,
    label: 'Professional / Working',
    description: "I'm early in my career",
  },
  {
    value: 'gap_year',
    icon: Compass,
    label: 'Gap Year / Other',
    description: "I'm figuring things out",
  },
];

export const AcademicPathStep = ({ firstName, selectedPath, onNameChange, onSelect }: AcademicPathStepProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold"
        >
          Let's get to know you
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          This helps us personalize everything for you
        </motion.p>
      </div>

      {/* Name Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-md mx-auto space-y-2"
      >
        <Label htmlFor="first_name" className="text-base">What should we call you?</Label>
        <Input
          id="first_name"
          type="text"
          placeholder="Enter your first name"
          value={firstName || ''}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-lg py-6"
          autoComplete="given-name"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
      >
        {PATH_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedPath === option.value;

          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              onClick={() => onSelect(option.value)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-300',
                'hover:scale-[1.02] active:scale-[0.98]',
                'text-left space-y-3',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
              )}
              aria-pressed={isSelected}
              role="radio"
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
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
              <div
                className={cn(
                  'h-12 w-12 rounded-lg flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              {/* Label */}
              <div className="space-y-1">
                <h3 className="font-semibold text-base">{option.label}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
