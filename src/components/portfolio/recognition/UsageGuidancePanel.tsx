import React from 'react';
import { MapPin, MessageSquare, Lightbulb, AlertCircle } from 'lucide-react';

export interface UsageGuidance {
  whereToUse: string[];
  howToFrame: string[];
  framingAngles: Array<{
    angle: string;
    example: string;
  }>;
  strategicNote?: string;
}

interface UsageGuidancePanelProps {
  guidance: UsageGuidance;
}

export const UsageGuidancePanel: React.FC<UsageGuidancePanelProps> = ({ guidance }) => {
  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Where to Use */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <h4 className="text-sm font-bold text-foreground">WHERE TO USE IT</h4>
        </div>
        <ul className="space-y-1.5 ml-6">
          {guidance.whereToUse.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* How to Frame */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-500" />
          <h4 className="text-sm font-bold text-foreground">HOW TO FRAME IT</h4>
        </div>
        <ul className="space-y-1.5 ml-6">
          {guidance.howToFrame.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Framing Angles */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-bold text-foreground">MULTIPLE FRAMING ANGLES</h4>
        </div>
        <div className="space-y-2 ml-6">
          {guidance.framingAngles.map((angle, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="text-amber-500">→</span>
                {angle.angle}:
              </div>
              <div className="text-sm text-muted-foreground italic ml-4 pl-3 border-l-2 border-muted">
                "{angle.example}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Note */}
      {guidance.strategicNote && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">STRATEGIC NOTE</div>
              <p className="text-sm text-muted-foreground">{guidance.strategicNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
