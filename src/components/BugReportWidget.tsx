import { useState, useEffect } from 'react';
import { Bug, Send, X, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BugReportData {
  title: string;
  description: string;
  category: string;
  severity: string;
  creditsAffected?: number;
  userEmail?: string;
}

const categories = [
  { value: 'general', label: '🐛 General Bug' },
  { value: 'credit_issue', label: '💳 Credit/Billing Issue' },
  { value: 'ui_bug', label: '🎨 UI/Display Issue' },
  { value: 'feature_broken', label: '⚙️ Feature Not Working' },
  { value: 'data_issue', label: '📊 Data/Content Issue' },
];

const severities = [
  { value: 'low', label: 'Low - Minor inconvenience', color: 'text-green-600' },
  { value: 'medium', label: 'Medium - Affects functionality', color: 'text-yellow-600' },
  { value: 'high', label: 'High - Major feature broken', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical - Can\'t use the app', color: 'text-red-600' },
];

export function BugReportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    category: 'general',
    severity: 'medium',
    creditsAffected: undefined,
    userEmail: '',
  });

  // Pre-fill user email if authenticated
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, userEmail: user.email }));
    }
  }, [user]);

  // Reset form when closing
  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    if (isSuccess) {
      setIsSuccess(false);
      setFormData({
        title: '',
        description: '',
        category: 'general',
        severity: 'medium',
        creditsAffected: undefined,
        userEmail: user?.email || '',
      });
    }
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    return browser;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        pageUrl: window.location.href,
        browserInfo: getBrowserInfo(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-bug-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit bug report');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-gradient-to-r from-violet-600 to-purple-600",
          "text-white font-medium text-sm",
          "shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30",
          "transform hover:scale-105 transition-all duration-200",
          "border border-violet-400/30",
          "group"
        )}
        aria-label="Report a bug"
      >
        <Bug className="w-5 h-5 group-hover:animate-pulse" />
        <span className="hidden sm:inline">Report Issue</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal content */}
          <div className={cn(
            "relative w-full max-w-lg",
            "bg-white rounded-2xl shadow-2xl",
            "overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}>
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bug className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Report an Issue</h2>
                    <p className="text-white/80 text-sm">Help us squash bugs faster!</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Early access notice */}
              <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span className="text-white/90 text-xs">
                  We're in early access! Your feedback helps us improve.
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Thank You! 🙏
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your report has been submitted. We'll look into this and get back to you if needed.
                  </p>
                  <Button onClick={handleClose} variant="outline">
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Your Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.userEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    <p className="text-xs text-gray-500">So we can follow up or compensate you if needed</p>
                  </div>

                  {/* Title field */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      What went wrong? <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>

                  {/* Category & Severity row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                      >
                        <SelectTrigger className="bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {severities.map((sev) => (
                            <SelectItem key={sev.value} value={sev.value}>
                              <span className={sev.color}>{sev.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Details <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="What were you trying to do? What happened instead? Any error messages?"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={4}
                      className="bg-gray-50 border-gray-200 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Credits affected field */}
                  {(formData.category === 'credit_issue' || formData.category === 'feature_broken') && (
                    <div className="space-y-2 p-4 bg-violet-50 rounded-xl border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-violet-600" />
                        <Label className="text-sm font-medium text-violet-800">
                          Credits Compensation
                        </Label>
                      </div>
                      <Input
                        type="number"
                        placeholder="How many credits were affected? (estimate)"
                        value={formData.creditsAffected || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          creditsAffected: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        min={0}
                        className="bg-white border-violet-200"
                      />
                      <p className="text-xs text-violet-700">
                        We'll review and compensate any credits lost due to bugs.
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.title || !formData.description}
                    className={cn(
                      "w-full h-12 text-base font-semibold",
                      "bg-gradient-to-r from-violet-600 to-purple-600",
                      "hover:from-violet-700 hover:to-purple-700",
                      "text-white shadow-lg shadow-violet-500/25",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Submit Report
                      </span>
                    )}
                  </Button>

                  {/* Footer note */}
                  <p className="text-center text-xs text-gray-500">
                    Your current page URL and browser info will be included to help us debug.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BugReportWidget;

