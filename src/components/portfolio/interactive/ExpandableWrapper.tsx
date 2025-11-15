import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ExpandableWrapperProps {
  id: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  collapsedContent: ReactNode;
  className?: string;
  shapeClass?: string;
  expandedHeight?: string;
}

export const ExpandableWrapper: React.FC<ExpandableWrapperProps> = ({
  id,
  isExpanded,
  onToggle,
  children,
  collapsedContent,
  className = '',
  shapeClass = '',
  expandedHeight = '70vh',
}) => {
  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[90]"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        initial={false}
        animate={
          isExpanded
            ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                width: '90vw',
                maxWidth: '1200px',
                height: expandedHeight,
                zIndex: 100,
                scale: 1,
              }
            : {
                position: 'relative',
                top: 'auto',
                left: 'auto',
                x: 0,
                y: 0,
                width: '100%',
                height: 'auto',
                zIndex: 1,
                scale: 1,
              }
        }
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={cn(
          'expandable-component cursor-pointer transition-shadow',
          shapeClass,
          className,
          isExpanded && 'overflow-y-auto shadow-depth-4'
        )}
        onClick={!isExpanded ? onToggle : undefined}
      >
        <div className="h-full">
          {isExpanded ? (
            <div className="p-8" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onToggle}
                className="absolute top-4 right-4 p-2 rounded-lg bg-muted/80 hover:bg-muted transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              {children}
            </div>
          ) : (
            collapsedContent
          )}
        </div>
      </motion.div>
    </>
  );
};
