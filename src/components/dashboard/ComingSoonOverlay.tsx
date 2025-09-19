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
      <div className="blur-sm opacity-40 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay with shiny gradient border */}
      <div className="absolute inset-4 flex items-center justify-center bg-background/30 backdrop-blur-sm rounded-lg">
        <Card className="max-w-lg mx-auto shadow-large border-4 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-md rounded-2xl"
              style={{
                borderImage: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.8), hsl(var(--primary) / 0.8)) 1'
              }}>
          <CardContent className="p-6 text-center space-y-4">
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
            
            <div className="pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Coming in Expert Mode:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• AI Application Description Workshop</div>
                <div>• Advanced Portfolio Intelligence Engine</div>
                <div>• Strategic Narrative Architecture</div>
                <div>• Competitive Positioning Analytics</div>
                <div>• Multi-Platform Essay Optimization</div>
                <div>• Real-time Writing Enhancement AI</div>
                <div>• Comprehensive Impact Assessment</div>
              </div>
            </div>
            
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