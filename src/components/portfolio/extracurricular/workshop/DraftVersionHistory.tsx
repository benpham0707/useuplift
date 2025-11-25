/**
 * Draft Version History Modal
 * 
 * Simple version history viewer for essay drafts showing:
 * - Timeline of draft versions
 * - Score changes
 * - Quick restore functionality
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, RotateCcw } from 'lucide-react';

interface DraftVersion {
  id: string;
  description: string;
  timestamp: number;
  score: number;
  categories?: Array<{ name: string; score: number }>;
}

interface DraftVersionHistoryProps {
  versions: DraftVersion[];
  currentVersionId?: string;
  onRestore: (description: string) => void;
  onClose: () => void;
}

export function DraftVersionHistory({ 
  versions, 
  currentVersionId, 
  onRestore, 
  onClose 
}: DraftVersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full p-6">
          <h2 className="text-2xl font-bold mb-4">No Version History</h2>
          <p className="text-muted-foreground mb-6">
            No saved versions yet. Make changes to your draft to create versions.
          </p>
          <Button onClick={onClose}>Close</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Simple Header */}
        <div className="p-6 pb-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold whitespace-nowrap">Version History</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Single-Column List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {versions.map((version) => {
              const isCurrent = version.id === currentVersionId;

              return (
                <Card
                  key={version.id}
                  className={`relative p-4 transition-all hover:shadow-md flex items-center gap-6 ${
                    isCurrent
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                >
                  {/* Score */}
                  <div className="flex-shrink-0 text-center min-w-[80px]">
                    <div className="text-4xl font-bold text-foreground">
                      {version.score}
                    </div>
                    <div className="text-sm text-muted-foreground">/100</div>
                  </div>

                  {/* Date */}
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      {new Date(version.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(version.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}

                  {/* Restore Button */}
                  {!isCurrent && (
                    <Button
                      onClick={() => onRestore(version.description)}
                      size="sm"
                      variant="ghost"
                      className="gap-2 hover:bg-muted"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
