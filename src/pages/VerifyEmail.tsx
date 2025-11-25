import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VerifyEmail = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Verify your email</CardTitle>
          <CardDescription>Check your inbox for the link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Please verify your email address to continue. 
            Once verified, refresh this page or sign in again.
          </div>
          <div className="flex items-center justify-center">
            <Button asChild variant="outline">
                <a href="/auth">Back to Sign In</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
