import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  const lastUpdated = "November 26, 2025";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-secondary/30 rounded-lg">
          <h2 className="font-semibold mb-4">Table of Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#information-we-collect" className="text-muted-foreground hover:text-foreground transition-colors">1. Information We Collect</a></li>
            <li><a href="#how-we-use" className="text-muted-foreground hover:text-foreground transition-colors">2. How We Use Your Information</a></li>
            <li><a href="#ai-and-data" className="text-muted-foreground hover:text-foreground transition-colors">3. AI and Your Data</a></li>
            <li><a href="#data-storage" className="text-muted-foreground hover:text-foreground transition-colors">4. Data Storage and Security</a></li>
            <li><a href="#third-party" className="text-muted-foreground hover:text-foreground transition-colors">5. Third-Party Services</a></li>
            <li><a href="#your-rights" className="text-muted-foreground hover:text-foreground transition-colors">6. Your Rights</a></li>
            <li><a href="#data-retention" className="text-muted-foreground hover:text-foreground transition-colors">7. Data Retention</a></li>
            <li><a href="#childrens-privacy" className="text-muted-foreground hover:text-foreground transition-colors">8. Children's Privacy</a></li>
            <li><a href="#changes" className="text-muted-foreground hover:text-foreground transition-colors">9. Changes to This Policy</a></li>
            <li><a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">10. Contact Us</a></li>
          </ol>
        </nav>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12">
          
          <p className="text-lg leading-relaxed">
            At Uplift, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered college guidance platform. Please read this policy carefully. By using Uplift, you agree to the collection and use of information in accordance with this policy.
          </p>

          <Separator />

          {/* Section 1 */}
          <section id="information-we-collect">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Account Information</h3>
            <p className="text-muted-foreground mb-4">
              When you create an account through our authentication provider (Clerk), we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your name and email address</li>
              <li>Profile picture (if provided)</li>
              <li>Authentication credentials (managed securely by Clerk)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Profile and Academic Data</h3>
            <p className="text-muted-foreground mb-4">
              To provide personalized guidance, we collect information you provide about:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Academic history (GPA, courses, test scores)</li>
              <li>Extracurricular activities and achievements</li>
              <li>Personal essays and written content</li>
              <li>College preferences and goals</li>
              <li>Family and demographic information (optional)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Payment Information</h3>
            <p className="text-muted-foreground mb-4">
              When you make purchases, our payment processor (Stripe) collects:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Billing name and address</li>
              <li>Payment card details (stored securely by Stripe, not on our servers)</li>
              <li>Transaction history</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Usage Data</h3>
            <p className="text-muted-foreground">
              We automatically collect information about how you interact with Uplift, including pages visited, features used, and time spent on the platform.
            </p>
          </section>

          <Separator />

          {/* Section 2 */}
          <section id="how-we-use">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Provide AI-Powered Guidance:</strong> Analyze your profile and essays to deliver personalized recommendations and feedback</li>
              <li><strong>Process Payments:</strong> Handle subscriptions, credit purchases, and billing</li>
              <li><strong>Improve Our Services:</strong> Understand how users interact with Uplift to enhance features and user experience</li>
              <li><strong>Communicate With You:</strong> Send important updates about your account, service changes, and (with your consent) promotional content</li>
              <li><strong>Ensure Security:</strong> Protect against fraud, unauthorized access, and other security threats</li>
              <li><strong>Comply With Legal Obligations:</strong> Meet applicable legal requirements</li>
            </ul>
          </section>

          <Separator />

          {/* Section 3 */}
          <section id="ai-and-data">
            <h2 className="text-2xl font-semibold mb-4">3. AI and Your Data</h2>
            <p className="text-muted-foreground mb-4">
              Uplift uses artificial intelligence to analyze your essays, extracurricular activities, and profile to provide personalized guidance. Here's what you should know:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3">How AI Processes Your Content</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your essays and profile data are sent to AI providers (Anthropic and OpenAI) for analysis</li>
              <li>AI analysis is used to generate feedback, suggestions, and scores</li>
              <li>We use prompts designed to protect your privacy and focus only on educational guidance</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">AI Provider Data Practices</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Our AI providers (Anthropic and OpenAI) do not use your data to train their models under our business agreements</li>
              <li>Data sent to AI providers is processed in real-time and not permanently stored by them</li>
              <li>You retain full ownership of all content you create, including essays and responses</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Your Content Ownership</h3>
            <p className="text-muted-foreground">
              You own all essays, personal statements, and other content you create on Uplift. We only use your content to provide our services to you and do not sell or share your content with third parties for their own purposes.
            </p>
          </section>

          <Separator />

          {/* Section 4 */}
          <section id="data-storage">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Where Your Data Is Stored</h3>
            <p className="text-muted-foreground mb-4">
              Your data is stored securely using Supabase, which is hosted on Amazon Web Services (AWS) infrastructure. Our primary data centers are located in the United States.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">Security Measures</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All data is encrypted in transit using TLS/SSL</li>
              <li>Data at rest is encrypted using industry-standard encryption</li>
              <li>We use secure authentication through Clerk with support for multi-factor authentication</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls limit employee access to user data</li>
            </ul>

            <p className="text-muted-foreground mt-4">
              While we implement robust security measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your data.
            </p>
          </section>

          <Separator />

          {/* Section 5 */}
          <section id="third-party">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We use trusted third-party services to operate Uplift. These services have their own privacy policies:
            </p>
            
            <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
              <li>
                <strong>Clerk</strong> - Authentication and user management
                <br /><span className="text-sm">Handles secure sign-in, account creation, and identity verification</span>
              </li>
              <li>
                <strong>Stripe</strong> - Payment processing
                <br /><span className="text-sm">Securely processes payments and manages subscriptions</span>
              </li>
              <li>
                <strong>Anthropic (Claude)</strong> - AI analysis
                <br /><span className="text-sm">Powers our essay feedback and portfolio analysis features</span>
              </li>
              <li>
                <strong>OpenAI</strong> - AI analysis
                <br /><span className="text-sm">Provides additional AI capabilities for content analysis</span>
              </li>
              <li>
                <strong>Supabase</strong> - Database and backend services
                <br /><span className="text-sm">Securely stores your profile and application data</span>
              </li>
            </ul>
          </section>

          <Separator />

          {/* Section 6 */}
          <section id="your-rights">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the following rights regarding your personal data:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
              <li><strong>Restrict Processing:</strong> Request that we limit how we use your data</li>
            </ul>

            <p className="text-muted-foreground mt-4">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@useuplift.io" className="text-primary hover:underline">privacy@useuplift.io</a>. We will respond to your request within 30 days.
            </p>
          </section>

          <Separator />

          {/* Section 7 */}
          <section id="data-retention">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Active Accounts</h3>
            <p className="text-muted-foreground mb-4">
              We retain your data for as long as your account is active or as needed to provide you services.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">Account Deletion</h3>
            <p className="text-muted-foreground mb-4">
              When you delete your account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your profile data and essays are permanently deleted within 30 days</li>
              <li>Some data may be retained longer if required by law or for legitimate business purposes (e.g., transaction records for tax purposes)</li>
              <li>Anonymized, aggregated data may be retained for analytics</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Inactive Accounts</h3>
            <p className="text-muted-foreground">
              Accounts inactive for more than 24 months may be subject to deletion after notice.
            </p>
          </section>

          <Separator />

          {/* Section 8 */}
          <section id="childrens-privacy">
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground mb-4">
              Uplift is designed for students aged 13 and older. We comply with the Children's Online Privacy Protection Act (COPPA):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Users must be at least 13 years old to create an account</li>
              <li>Users between 13 and 18 should have parental consent before using Uplift</li>
              <li>We do not knowingly collect personal information from children under 13</li>
              <li>If we discover we have collected data from a child under 13, we will delete it promptly</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              If you believe a child under 13 has provided us with personal information, please contact us immediately at <a href="mailto:privacy@useuplift.io" className="text-primary hover:underline">privacy@useuplift.io</a>.
            </p>
          </section>

          <Separator />

          {/* Section 9 */}
          <section id="changes">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. For significant changes, we may also send you an email notification. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <Separator />

          {/* Section 10 */}
          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-secondary/30 p-6 rounded-lg">
              <p className="font-medium mb-2">Uplift</p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:privacy@useuplift.io" className="text-primary hover:underline">privacy@useuplift.io</a>
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
