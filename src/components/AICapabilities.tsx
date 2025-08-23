import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Bell, MessageSquare, TrendingUp } from 'lucide-react';

const capabilities = [
  {
    icon: Brain,
    title: 'Contextual Intelligence',
    description: 'Not Just Another Chatbot',
    features: [
      'Understands that 3.5 GPA while working is exceptional',
      'Recognizes caregiving as leadership experience',
      'Values non-traditional achievements and experiences',
      'Considers your full life context, not just grades'
    ],
    color: 'bg-primary'
  },
  {
    icon: Bell,
    title: 'Proactive Guidance',
    description: 'Always One Step Ahead',
    features: [
      'Reminds you of deadlines before they become urgent',
      'Suggests opportunities you didn\'t know existed',
      'Alerts you to new paths based on evolving interests',
      'Anticipates challenges and prepares solutions'
    ],
    color: 'bg-secondary'
  },
  {
    icon: MessageSquare,
    title: 'Authentic Voice Preservation',
    description: 'Your Story, Your Way',
    features: [
      'Helps you find YOUR story, not write it for you',
      'Maintains your unique perspective and personality',
      'Guides without replacing your authentic voice',
      'Ensures applications sound genuinely like you'
    ],
    color: 'bg-primary-light'
  },
  {
    icon: TrendingUp,
    title: 'Continuous Learning',
    description: 'Gets Smarter Over Time',
    features: [
      'Grows more intelligent with every interaction',
      'Adapts to your changing goals and interests',
      'Remembers your entire journey for reflection',
      'Learns from successful outcomes to help others'
    ],
    color: 'bg-secondary-light'
  }
];

const AICapabilities = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Intelligence That Makes a Difference
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI doesn't just process information—it understands context, 
            anticipates needs, and preserves what makes you uniquely you.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {capabilities.map((capability, index) => (
            <Card key={capability.title} className="shadow-medium hover-lift animate-slide-up border-0" 
                  style={{animationDelay: `${index * 0.1}s`}}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${capability.color} flex-shrink-0`}>
                    <capability.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">{capability.title}</CardTitle>
                    <p className="text-muted-foreground font-medium">{capability.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {capability.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <p className="text-foreground text-sm leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demonstration Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                See the Difference in Action
              </h3>
              <p className="text-muted-foreground mb-6">
                While other tools give generic advice, Uplift's AI understands that your 
                part-time job isn't a distraction—it's proof of your work ethic, time 
                management, and responsibility.
              </p>
              
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-muted-foreground">Generic AI</span>
                  </div>
                  <p className="text-sm text-foreground">
                    "You should focus on raising your GPA instead of working."
                  </p>
                </div>
                
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-primary">Uplift AI</span>
                  </div>
                  <p className="text-sm text-foreground">
                    "Your 3.5 GPA while working 20 hours shows incredible time management. 
                    Let's highlight this work experience as leadership in your applications."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-background rounded-xl p-6 shadow-medium">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">AI Analysis</div>
                    <div className="text-xs text-muted-foreground">Contextual Understanding</div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Work Experience:</span>
                    <span className="text-green-600 font-medium">Leadership Asset ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Management:</span>
                    <span className="text-green-600 font-medium">Exceptional ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPA Context:</span>
                    <span className="text-green-600 font-medium">Above Average ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Financial Need:</span>
                    <span className="text-blue-600 font-medium">Scholarship Priority ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AICapabilities;