import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, FileText, Target } from 'lucide-react';

interface StrategicUsage {
  credibilityReferences: Array<{
    recognition: string;
    whenToReference: string;
    exampleFraming: string;
  }>;
  expandOnInAdditionalInfo: Array<{
    recognition: string;
    whatToInclude: string[];
  }>;
  positioning: {
    flagship: string[];
    bridge: string[];
    support: string[];
  };
}

interface StrategicUsageTabProps {
  data: StrategicUsage;
}

export const StrategicUsageTab: React.FC<StrategicUsageTabProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Recognitions to Reference for Credibility */}
      <Card className="p-6">
        <h3 className="mb-2 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Recognitions to Reference for Credibility</span>
        </h3>
        <div className="text-sm text-muted-foreground mb-4">In Essays & Short Answers:</div>
        
        <div className="space-y-4">
          {data.credibilityReferences.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border bg-muted/10">
              <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span>{item.recognition}</span>
              </div>
              
              <div className="mb-3">
                <div className="text-xs font-semibold text-muted-foreground mb-1">When to reference:</div>
                <p className="text-sm">{item.whenToReference}</p>
              </div>
              
              <div className="p-3 rounded-lg bg-background border">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Example framing:</div>
                <p className="text-sm italic leading-relaxed">"{item.exampleFraming}"</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* What to Expand On */}
      <Card className="p-6">
        <h3 className="mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">What to Expand On</span>
        </h3>
        <div className="text-sm text-muted-foreground mb-4">In Additional Info Section:</div>
        
        <div className="space-y-4">
          {data.expandOnInAdditionalInfo.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border bg-muted/10">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span>{item.recognition}</span>
              </div>
              
              <div className="text-xs font-semibold text-muted-foreground mb-2">What to include:</div>
              <ul className="space-y-2">
                {item.whatToInclude.map((point, pointIdx) => (
                  <li key={pointIdx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Strategic Positioning by Recognition Type */}
      <Card className="p-6">
        <h3 className="mb-2 flex items-center gap-2">
          <Target className="h-5 w-5" />
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Strategic Positioning by Recognition Type</span>
        </h3>
        <div className="text-sm text-muted-foreground mb-4">How to position each recognition in your application:</div>
        
        <div className="space-y-4">
          {/* Flagship */}
          <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-amber-600 hover:bg-amber-700">Flagship</Badge>
              <span className="text-sm text-muted-foreground">(Lead credentials)</span>
            </div>
            <ul className="space-y-1">
              {data.positioning.flagship.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-amber-600 mt-1">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bridge */}
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-blue-600 hover:bg-blue-700">Bridge</Badge>
              <span className="text-sm text-muted-foreground">(Strong supporting)</span>
            </div>
            <ul className="space-y-1">
              {data.positioning.bridge.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-blue-600 mt-1">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Support</Badge>
              <span className="text-sm text-muted-foreground">(List but minimize emphasis)</span>
            </div>
            <ul className="space-y-1">
              {data.positioning.support.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">→</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
