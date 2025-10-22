import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        <h2 className="text-3xl font-bold">✍️ Narrative Fit Workshop</h2>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          How to use this workshop
        </button>
        
        {isExpanded && (
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="font-semibold text-base">Transform your recognition description into an officer-ready narrative:</p>
            <div className="grid gap-2 text-sm leading-relaxed">
              <div className="flex gap-3">
                <span className="font-bold text-primary">1️⃣</span>
                <span>Review your draft and overall score</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">2️⃣</span>
                <span>Expand rubric dimensions to see specific issues</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">3️⃣</span>
                <span>Click issues to see analysis and edit suggestions</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">4️⃣</span>
                <span>Apply edits and watch your scores improve in real-time</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">5️⃣</span>
                <span>Use undo/redo to experiment with different approaches</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
