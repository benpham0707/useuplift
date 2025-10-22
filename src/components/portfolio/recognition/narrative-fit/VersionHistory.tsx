import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2 } from 'lucide-react';

interface VersionHistoryProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  versionInfo: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  versionInfo
}) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">{versionInfo}</span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="gap-1"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="gap-1"
        >
          Redo
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
