import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ProfileSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: string;
  title: string;
  description: string;
  estimatedTime: string;
  children: React.ReactNode;
}

/**
 * ProfileSectionModal
 *
 * Centered modal wizard for profile section forms
 * - Appears in the center of the screen (similar to portfolio scanner assessment)
 * - Compact, focused design for better user experience
 * - Displays section metadata (title, description, estimated time)
 * - Scrollable content area for forms
 * - Forms handle their own save logic
 */
export default function ProfileSectionModal({
  isOpen,
  onClose,
  sectionKey,
  title,
  description,
  estimatedTime,
  children,
}: ProfileSectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header with animated gradient accent - Fixed at top */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x bg-[length:200%_100%]" />

          <DialogHeader className="p-6 pb-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {title}
              </DialogTitle>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex-shrink-0"
              >
                {estimatedTime}
              </Badge>
            </div>
            <DialogDescription className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable form content */}
        <div className="overflow-y-auto p-6 min-h-0 flex-1">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
