import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, ArrowRight } from 'lucide-react';

interface PathwayTipProps {
  title: string;
  description: string;
  actionText?: string;
}

const PathwayTip = ({ title, description, actionText }: PathwayTipProps) => {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {title}
            </h4>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            
            {actionText && (
              <div className="flex items-center space-x-1 mt-3 text-xs text-primary font-medium">
                <span>{actionText}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PathwayTip;