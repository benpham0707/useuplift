import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Artifact } from './ProofStrip';
import { FileText, Image, Video, BarChart, Quote, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtifactModalProps {
  artifact: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
}

const typeConfig = {
  screenshot: { icon: Image, color: 'text-blue-500' },
  document: { icon: FileText, color: 'text-green-500' },
  video: { icon: Video, color: 'text-purple-500' },
  data: { icon: BarChart, color: 'text-amber-500' },
  quote: { icon: Quote, color: 'text-pink-500' },
};

export const ArtifactModal: React.FC<ArtifactModalProps> = ({ artifact, isOpen, onClose }) => {
  if (!artifact) return null;

  const config = typeConfig[artifact.type];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", config.color)} />
            <DialogTitle>{artifact.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Thumbnail/Preview */}
          {artifact.thumbnail && (
            <div className="w-full max-h-96 bg-muted rounded-lg overflow-hidden">
              <img
                src={artifact.thumbnail}
                alt={artifact.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {artifact.description}
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Date</h3>
            <p className="text-sm text-muted-foreground">{artifact.date}</p>
          </div>

          {/* Link */}
          {artifact.link && (
            <a
              href={artifact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View Full Source
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};