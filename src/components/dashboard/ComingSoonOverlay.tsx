import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Crown } from 'lucide-react';

interface ComingSoonOverlayProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({
  children,
  title = "Expert Mode Feature",
  description = "Advanced analytics and insights coming soon!",
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Blur the background content */}
      <div className="blur-sm opacity-30 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="max-w-md mx-auto shadow-large border-2 border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div className="p-3 rounded-full bg-gradient-primary text-white shadow-soft">
                <Crown className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                <Lock className="h-3 w-3 mr-1" />
                Expert Mode
              </Badge>
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {title}
            </h3>
            
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
            
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Unlock advanced analysis, personalized insights, and comprehensive tools in Expert Mode
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};