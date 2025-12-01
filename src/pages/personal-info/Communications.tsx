import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Communications } from '@/schemas/personal';
import { useToast } from '@/hooks/use-toast';

export default function CommunicationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<Communications>({
    contactPreference: 'none',
    marketingOptIn: false,
    consentAcknowledged: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('personalInfoProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.communications) {
          setData({ ...data, ...parsed.communications });
        }
      } catch (e) {
      }
    }
  }, []);

  // Auto-save
  useEffect(() => {
    const saved = localStorage.getItem('personalInfoProgress') || '{}';
    try {
      const parsed = JSON.parse(saved);
      const updated = { ...parsed, communications: data };
      localStorage.setItem('personalInfoProgress', JSON.stringify(updated));
    } catch (e) {
      localStorage.setItem('personalInfoProgress', JSON.stringify({ communications: data }));
    }
  }, [data]);

  const updateField = (field: keyof Communications, value: any) => {
    setData({ ...data, [field]: value });
  };

  const validateForm = () => {
    return data.consentAcknowledged;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "You must acknowledge the consent policy to continue.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    const saved = localStorage.getItem('personalInfoProgress') || '{}';
    try {
      const parsed = JSON.parse(saved);
      const updated = { 
        ...parsed, 
        communications: data,
        communicationsCompleted: true
      };
      localStorage.setItem('personalInfoProgress', JSON.stringify(updated));
      
      toast({
        title: "Progress Saved",
        description: "Your communications preferences have been saved.",
      });
      
      navigate('/personal-info');
    } catch (e) {
      toast({
        title: "Save Error", 
        description: "Could not save progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = validateForm();

  const completedFields = [
    data.contactPreference !== 'none',
    data.consentAcknowledged,
  ].filter(Boolean).length;

  const totalFields = 2;
  const completionProgress = (completedFields / totalFields) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/personal-info')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Communications & Consent</h1>
          <p className="text-muted-foreground mb-4">
            Contact preferences and required privacy acknowledgments
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <Progress value={completionProgress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {Math.round(completionProgress)}% Complete
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Contact Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>How would you prefer to be contacted?</Label>
                <RadioGroup 
                  value={data.contactPreference} 
                  onValueChange={(value) => updateField('contactPreference', value)}
                  className="mt-2"
                >
                  {[
                    { value: 'email', label: 'Email' },
                    { value: 'sms', label: 'SMS/Text' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'none', label: 'No communications' }
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`contact-${option.value}`} />
                      <Label htmlFor={`contact-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Opt-in */}
          <Card>
            <CardHeader>
              <CardTitle>Updates & Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing-opt"
                  checked={data.marketingOptIn}
                  onCheckedChange={(checked) => updateField('marketingOptIn', checked)}
                />
                <Label htmlFor="marketing-opt">
                  I'd like to receive occasional updates about college opportunities, deadlines, and helpful resources
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Consent & Privacy
                <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Data Privacy Notice</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  By continuing, you acknowledge that:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Your information will be used to provide personalized college guidance and recommendations</li>
                  <li>• We will not share your personal information with third parties without your consent</li>
                  <li>• You can request to update or delete your information at any time</li>
                  <li>• All data is encrypted and stored securely</li>
                  <li>• You must be at least 13 years old to use this service</li>
                  <li>• For users under 18, parent/guardian consent may be required for certain features</li>
                </ul>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consent"
                  checked={data.consentAcknowledged}
                  onCheckedChange={(checked) => updateField('consentAcknowledged', checked)}
                />
                <Label htmlFor="consent" className="leading-relaxed">
                  I acknowledge and agree to the data privacy notice above and consent to the collection and use of my information as described. I confirm that I am at least 13 years old. *
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Additional Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Educational Guidance Disclaimer:</strong> The recommendations and guidance provided are for informational purposes only and should not be considered as professional college counseling or guaranteed admission advice.
                </p>
                <p className="mb-2">
                  <strong>Accuracy of Information:</strong> While we strive to provide accurate and up-to-date information, college admission requirements and deadlines can change. Always verify information directly with institutions.
                </p>
                <p>
                  <strong>Personal Responsibility:</strong> Users are responsible for meeting all application deadlines and requirements. We are not liable for missed opportunities due to reliance on our platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/personal-info')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={!canContinue || submitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}