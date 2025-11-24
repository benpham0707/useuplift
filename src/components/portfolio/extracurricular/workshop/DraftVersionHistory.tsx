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
      <Card className="max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Simple Header */}
        <div className="p-6 pb-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Version History</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Grid of Version Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {versions.map((version) => {
              const isCurrent = version.id === currentVersionId;

              return (
                <Card
                  key={version.id}
                  className={`relative p-4 transition-all hover:shadow-md ${
                    isCurrent 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  {/* Restore Button */}
                  {!isCurrent && (
                    <Button
                      onClick={() => onRestore(version.description)}
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 hover:bg-muted"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Score */}
                  <div className="text-center mb-3 mt-2">
                    <div className="text-4xl font-bold text-foreground">
                      {version.score}
                    </div>
                    <div className="text-sm text-muted-foreground">/100</div>
                  </div>

                  {/* Date */}
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    {new Date(version.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    {new Date(version.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <div className="flex justify-center mt-3">
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    </div>
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
