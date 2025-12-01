/**
 * Version History Drawer
 * 
 * A responsive drawer/modal for viewing and restoring essay versions.
 * - Desktop: Right-side drawer (Sheet)
 * - Mobile: Full-screen modal
 * 
 * Features:
 * - Version list with type badges (autosave, milestone, analysis)
 * - Preview pane for selected version
 * - Restore functionality with confirmation
 * - Score display for analysis versions
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  History,
  RotateCcw,
  Sparkles,
  Bookmark,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PIQVersion, VersionSourceType } from '@/services/piqWorkshop/piqDatabaseService';

// =============================================================================
// TYPES
// =============================================================================

interface VersionHistoryDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** List of versions to display */
  versions: PIQVersion[];
  /** Currently loaded version ID (to mark as "Current") */
  currentVersionId?: string;
  /** Callback when user restores a version (passes full version object for score/analysis restoration) */
  onRestore: (version: PIQVersion) => Promise<void>;
  /** Whether currently loading versions */
  isLoading?: boolean;
  /** Optional error message */
  error?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format relative time for display
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format full timestamp for tooltip
 */
function formatFullTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get badge config for version type
 */
function getVersionBadge(createdBy: VersionSourceType, score?: number | null) {
  switch (createdBy) {
    case 'analysis':
      return {
        // Only show score in badge if it's meaningful (> 0)
        label: (score !== undefined && score !== null && score > 0) ? `Score: ${Math.round(score)}` : 'Analyzed',
        icon: Sparkles,
        className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      };
    case 'milestone':
      return {
        label: 'Milestone',
        icon: Bookmark,
        className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
      };
    case 'autosave':
    default:
      return {
        label: 'Autosave',
        icon: Clock,
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      };
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface VersionItemProps {
  version: PIQVersion;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

function VersionItem({ version, isSelected, isCurrent, onClick }: VersionItemProps) {
  const badge = getVersionBadge(version.created_by, version.score);
  const BadgeIcon = badge.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        'hover:bg-muted/50 hover:border-primary/30',
        isSelected && 'bg-primary/5 border-primary ring-1 ring-primary/20',
        !isSelected && 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className={cn('text-xs gap-1 font-medium', badge.className)}
            >
              <BadgeIcon className="w-3 h-3" />
              {badge.label}
            </Badge>
            {isCurrent && (
              <Badge variant="default" className="text-xs">
                Current
              </Badge>
            )}
          </div>

          {/* Label (for milestones) */}
          {version.label && (
            <p className="text-sm font-medium text-foreground mb-1 truncate">
              {version.label}
            </p>
          )}

          {/* Timestamp and word count */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span title={formatFullTimestamp(version.created_at)}>
              {formatRelativeTime(version.created_at)}
            </span>
            <span>•</span>
            <span>{version.word_count} words</span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          isSelected && 'text-primary rotate-90'
        )} />
      </div>
    </button>
  );
}

interface VersionPreviewProps {
  version: PIQVersion;
  isCurrent: boolean;
  onRestore: () => void;
  isRestoring: boolean;
}

function VersionPreview({ version, isCurrent, onRestore, isRestoring }: VersionPreviewProps) {
  const badge = getVersionBadge(version.created_by, version.score);

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="flex-shrink-0 pb-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Badge 
            variant="outline" 
            className={cn('text-xs gap-1', badge.className)}
          >
            <badge.icon className="w-3 h-3" />
            {badge.label}
          </Badge>
          {isCurrent && (
            <Badge variant="default" className="text-xs">
              Current
            </Badge>
          )}
        </div>

        {version.label && (
          <h4 className="font-medium text-foreground">{version.label}</h4>
        )}

        <div className="text-sm text-muted-foreground mt-1">
          <span title={formatFullTimestamp(version.created_at)}>
            {formatFullTimestamp(version.created_at)}
          </span>
          <span className="mx-2">•</span>
          <span>{version.word_count} words</span>
        </div>

        {/* Score display for analysis versions - only show if score is meaningful (> 0) */}
        {version.score !== undefined && version.score !== null && version.score > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(version.score)}
            </div>
            <div className="text-sm text-muted-foreground">/100</div>
          </div>
        )}
      </div>

      {/* Content Preview */}
      <ScrollArea className="flex-1 my-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {version.draft_content}
          </div>
        </div>
      </ScrollArea>

      {/* Restore Button */}
      {!isCurrent && (
        <div className="flex-shrink-0 pt-4 border-t">
          <Button
            onClick={onRestore}
            disabled={isRestoring}
            className="w-full gap-2"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Restore this version
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Your current content will be saved as an autosave first
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  onRestore,
  isLoading = false,
  error,
}: VersionHistoryDrawerProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Get selected version
  const selectedVersion = selectedVersionId 
    ? versions.find(v => v.id === selectedVersionId) 
    : null;

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset selection when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedVersionId(null);
    }
  }, [isOpen]);

  // Auto-select first version when drawer opens
  React.useEffect(() => {
    if (isOpen && versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[0].id);
    }
  }, [isOpen, versions, selectedVersionId]);

  const handleRestore = useCallback(async () => {
    if (!selectedVersion) return;

    setIsRestoring(true);
    try {
      // Pass full version object so parent can restore score/dimensions too
      await onRestore(selectedVersion);
      setShowRestoreConfirm(false);
      onClose();
    } catch (error) {
    } finally {
      setIsRestoring(false);
    }
  }, [selectedVersion, onRestore, onClose]);

  // Drawer content
  const drawerContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </SheetTitle>
          <SheetDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </SheetDescription>
        </SheetHeader>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-4 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-2" onClick={onClose}>
              Close
            </Button>
          </Card>
        </div>
      ) : versions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No versions yet</h3>
            <p className="text-sm text-muted-foreground">
              Your essay versions will appear here as you write and save.
            </p>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 mt-4 min-h-0">
          {/* Version List */}
          <div className={cn(
            'flex flex-col min-h-0',
            selectedVersion && !isMobile ? 'w-1/3' : 'w-full'
          )}>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-2">
                {versions.map((version) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isSelected={version.id === selectedVersionId}
                    isCurrent={version.id === currentVersionId}
                    onClick={() => setSelectedVersionId(version.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Preview Pane (desktop only, or when version selected on mobile) */}
          {selectedVersion && !isMobile && (
            <div className="w-2/3 border-l pl-4 min-h-0 flex flex-col">
              <VersionPreview
                version={selectedVersion}
                isCurrent={selectedVersion.id === currentVersionId}
                onRestore={() => setShowRestoreConfirm(true)}
                isRestoring={isRestoring}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile: Show preview in a nested dialog */}
      {isMobile && selectedVersion && (
        <Dialog 
          open={!!selectedVersion} 
          onOpenChange={(open) => !open && setSelectedVersionId(null)}
        >
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Version Preview</DialogTitle>
              <DialogDescription>
                {formatRelativeTime(selectedVersion.created_at)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <VersionPreview
                version={selectedVersion}
                isCurrent={selectedVersion.id === currentVersionId}
                onRestore={() => setShowRestoreConfirm(true)}
                isRestoring={isRestoring}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Restore confirmation dialog
  const restoreConfirmDialog = (
    <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this version?</AlertDialogTitle>
          <AlertDialogDescription>
            Your current essay content will be saved as an autosave version first, 
            then replaced with the selected version. You can always find your 
            current content in the version history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Restoring...
              </>
            ) : (
              'Restore'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Use Sheet for desktop, Dialog for mobile
  if (isMobile) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
            <div className="p-6 flex-1 min-h-0 flex flex-col">
              {drawerContent}
            </div>
          </DialogContent>
        </Dialog>
        {restoreConfirmDialog}
      </>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col"
        >
          {drawerContent}
        </SheetContent>
      </Sheet>
      {restoreConfirmDialog}
    </>
  );
}

export default VersionHistoryDrawer;

