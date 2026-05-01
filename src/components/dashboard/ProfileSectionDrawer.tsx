import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface ProfileSectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: string;
  title: string;
  description: string;
  estimatedTime: string;
  children: React.ReactNode;
}

/**
 * ProfileSectionDrawer
 *
 * Generic slide-in drawer for profile section forms
 * - Slides from right on desktop (~480px wide), full-width on mobile
 * - Displays section metadata (title, description, estimated time)
 * - Scrollable content area for forms
 * - Forms handle their own save logic
 */
export default function ProfileSectionDrawer({
  isOpen,
  onClose,
  sectionKey,
  title,
  description,
  estimatedTime,
  children,
}: ProfileSectionDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0"
      >
        {/* Animated gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x bg-[length:200%_100%]" />

        <div className="p-6">
          <SheetHeader className="space-y-3 pb-6 border-b border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2">
            <SheetTitle className="text-xl font-bold text-gray-900">
              {title}
            </SheetTitle>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
              {estimatedTime}
            </Badge>
          </div>
          <SheetDescription className="text-sm text-gray-600 max-w-md mx-auto">
            {description}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable form content */}
        <div className="mt-6">
          {children}
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
