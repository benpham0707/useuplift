import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigErrorProps {
  error: string;
  details?: string[];
}

export function ConfigError({ error, details }: ConfigErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Configuration Error</CardTitle>
          </div>
          <CardDescription className="text-base">
            The application cannot start due to missing configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="font-semibold text-destructive mb-2">Error:</p>
            <p className="text-sm text-foreground">{error}</p>
          </div>

          {details && details.length > 0 && (
            <div>
              <p className="font-semibold mb-2">Missing Configuration:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold mb-2 text-sm">For Production Deployment:</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to your Vercel project settings</li>
              <li>Navigate to Environment Variables</li>
              <li>Add the missing variables listed above</li>
              <li>Redeploy your application (with cache cleared)</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              Retry
            </Button>
            <Button
              onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
              className="flex-1"
            >
              Open Vercel Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
