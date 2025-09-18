import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Crown, ArrowRight } from 'lucide-react';

interface ComingSoonOverlayProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ 
  children, 
  title = "Expert Mode",
  description = "Advanced analytics and insights coming soon",
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Blurred Content */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8">
        <Card className="w-full max-w-md glass-card border-2 border-primary/30 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-gradient-primary text-white shadow-elegant">
                <Crown className="h-8 w-8" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/40">
                  <Zap className="h-3 w-3 mr-1" />
                  {title}
                </Badge>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground">
                Coming Soon
              </h3>
              
              <p className="text-muted-foreground">
                {description}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <p className="text-sm text-foreground/80 mb-2">Get ready for:</p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>• Advanced portfolio analysis</li>
                  <li>• Detailed strategic insights</li>
                  <li>• Personalized recommendations</li>
                  <li>• AI-powered essay optimization</li>
                </ul>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-primary/30 hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  // Future: Switch to Expert view or upgrade prompt
                }}
              >
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Available in Expert Mode
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};