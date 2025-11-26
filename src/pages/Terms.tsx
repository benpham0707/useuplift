import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-secondary/30 rounded-lg">
          <h2 className="font-semibold mb-4">Table of Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#acceptance" className="text-muted-foreground hover:text-foreground transition-colors">1. Acceptance of Terms</a></li>
            <li><a href="#description" className="text-muted-foreground hover:text-foreground transition-colors">2. Description of Service</a></li>
            <li><a href="#accounts" className="text-muted-foreground hover:text-foreground transition-colors">3. User Accounts</a></li>
            <li><a href="#payments" className="text-muted-foreground hover:text-foreground transition-colors">4. Subscriptions and Payments</a></li>
            <li><a href="#user-content" className="text-muted-foreground hover:text-foreground transition-colors">5. User Content</a></li>
            <li><a href="#ai-content" className="text-muted-foreground hover:text-foreground transition-colors">6. AI-Generated Content</a></li>
            <li><a href="#prohibited" className="text-muted-foreground hover:text-foreground transition-colors">7. Prohibited Uses</a></li>
            <li><a href="#intellectual-property" className="text-muted-foreground hover:text-foreground transition-colors">8. Intellectual Property</a></li>
            <li><a href="#disclaimers" className="text-muted-foreground hover:text-foreground transition-colors">9. Disclaimers</a></li>
            <li><a href="#liability" className="text-muted-foreground hover:text-foreground transition-colors">10. Limitation of Liability</a></li>
            <li><a href="#indemnification" className="text-muted-foreground hover:text-foreground transition-colors">11. Indemnification</a></li>
            <li><a href="#termination" className="text-muted-foreground hover:text-foreground transition-colors">12. Termination</a></li>
            <li><a href="#changes" className="text-muted-foreground hover:text-foreground transition-colors">13. Changes to Terms</a></li>
            <li><a href="#governing-law" className="text-muted-foreground hover:text-foreground transition-colors">14. Governing Law</a></li>
            <li><a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">15. Contact Us</a></li>
          </ol>
        </nav>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12">
          
          <p className="text-lg leading-relaxed">
            Welcome to Uplift. These Terms of Service ("Terms") govern your use of the Uplift platform and services. By accessing or using Uplift, you agree to be bound by these Terms. If you do not agree, please do not use our services.
          </p>

          <Separator />

          {/* Section 1 */}
          <section id="acceptance">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By creating an account or using Uplift, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
            <p className="text-muted-foreground">
              If you are using Uplift on behalf of an organization (such as a school or counseling service), you represent that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <Separator />

          {/* Section 2 */}
          <section id="description">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              Uplift is an AI-powered college guidance platform that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Portfolio Scanner:</strong> Analysis of your extracurricular activities and achievements</li>
              <li><strong>Essay Workshops:</strong> AI-assisted feedback and coaching for college application essays</li>
              <li><strong>PIQ Helper:</strong> Guidance for UC Personal Insight Questions</li>
              <li><strong>Strategic Recommendations:</strong> Personalized suggestions to strengthen your application</li>
              <li><strong>Progress Tracking:</strong> Tools to monitor your application preparation journey</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Our services are designed to supplement, not replace, guidance from school counselors, teachers, and other educational professionals.
            </p>
          </section>

          <Separator />

          {/* Section 3 */}
          <section id="accounts">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Account Creation</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must be at least 13 years old to create an account</li>
              <li>Users under 18 should have parental or guardian consent</li>
              <li>You must provide accurate and complete information during registration</li>
              <li>You may only create one account per person</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Account Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>We recommend enabling two-factor authentication for enhanced security</li>
            </ul>
          </section>

          <Separator />

          {/* Section 4 */}
          <section id="payments">
            <h2 className="text-2xl font-semibold mb-4">4. Subscriptions and Payments</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Credit System</h3>
            <p className="text-muted-foreground mb-4">
              Uplift operates on a credit-based system:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>New users receive complimentary credits upon signup</li>
              <li>Additional credits can be purchased as one-time packs</li>
              <li>Subscription plans include monthly credit allocations</li>
              <li>Credits are consumed when using AI-powered features</li>
              <li>Purchased credits do not expire</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Subscriptions</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>Your subscription will automatically renew unless cancelled</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Cancelled subscriptions remain active until the end of the current billing period</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Refund Policy</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscription fees are generally non-refundable</li>
              <li>We may offer refunds at our discretion for technical issues that prevented service use</li>
              <li>Unused credits are not eligible for refund</li>
              <li>To request a refund, contact <a href="mailto:support@useuplift.io" className="text-primary hover:underline">support@useuplift.io</a> within 7 days of purchase</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Price Changes</h3>
            <p className="text-muted-foreground">
              We reserve the right to modify pricing with 30 days' notice. Price changes will apply to subsequent billing cycles, not current subscriptions.
            </p>
          </section>

          <Separator />

          {/* Section 5 */}
          <section id="user-content">
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Ownership</h3>
            <p className="text-muted-foreground mb-4">
              You retain full ownership of all content you create and submit to Uplift, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Essays and personal statements</li>
              <li>Activity descriptions</li>
              <li>Profile information</li>
              <li>Any other original content</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">License to Uplift</h3>
            <p className="text-muted-foreground mb-4">
              By submitting content, you grant Uplift a limited, non-exclusive license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Process your content through our AI systems to provide feedback</li>
              <li>Store your content to enable our services</li>
              <li>Display your content back to you within the platform</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              This license exists solely to provide our services and terminates when you delete your content or account.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">Content Responsibility</h3>
            <p className="text-muted-foreground">
              You are solely responsible for your content. You represent that your content is original, accurate, and does not infringe on any third-party rights.
            </p>
          </section>

          <Separator />

          {/* Section 6 */}
          <section id="ai-content">
            <h2 className="text-2xl font-semibold mb-4">6. AI-Generated Content</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Nature of AI Assistance</h3>
            <p className="text-muted-foreground mb-4">
              Uplift provides AI-generated feedback, suggestions, and analysis. Please understand:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI suggestions are guidance tools, not guaranteed formulas for admission</li>
              <li>You should review and adapt all AI suggestions to maintain your authentic voice</li>
              <li>AI analysis may not always be perfectly accurate or appropriate for your situation</li>
              <li>Human review of all content before submission is strongly recommended</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">No Guarantees</h3>
            <p className="text-muted-foreground">
              <strong>Uplift does not guarantee admission to any educational institution.</strong> College admissions decisions involve many factors beyond essay quality, and our AI tools cannot predict or ensure specific outcomes.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">Academic Integrity</h3>
            <p className="text-muted-foreground">
              AI-generated suggestions should be used as inspiration and guidance. You are responsible for ensuring your final submissions represent your own work and comply with each institution's academic integrity policies.
            </p>
          </section>

          <Separator />

          {/* Section 7 */}
          <section id="prohibited">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to use Uplift to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Plagiarize:</strong> Submit AI-generated content as entirely your own work without adaptation</li>
              <li><strong>Commit Fraud:</strong> Misrepresent your identity, achievements, or qualifications</li>
              <li><strong>Violate Academic Policies:</strong> Use our services in ways that violate your school's honor code</li>
              <li><strong>Share Accounts:</strong> Allow others to access your account or share your credentials</li>
              <li><strong>Abuse the System:</strong> Attempt to manipulate, hack, or exploit our services</li>
              <li><strong>Resell Services:</strong> Commercially resell or redistribute Uplift's services</li>
              <li><strong>Harass Others:</strong> Use our platform to harass, threaten, or harm others</li>
              <li><strong>Violate Laws:</strong> Use our services for any unlawful purpose</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Violation of these terms may result in immediate account termination without refund.
            </p>
          </section>

          <Separator />

          {/* Section 8 */}
          <section id="intellectual-property">
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Uplift's Property</h3>
            <p className="text-muted-foreground mb-4">
              Uplift and its licensors own all rights to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The Uplift platform, software, and technology</li>
              <li>Our branding, logos, and trademarks</li>
              <li>AI models, algorithms, and analytical frameworks</li>
              <li>Educational content and methodologies</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Limited License</h3>
            <p className="text-muted-foreground">
              We grant you a limited, non-exclusive, non-transferable license to access and use Uplift for personal, non-commercial educational purposes in accordance with these Terms.
            </p>
          </section>

          <Separator />

          {/* Section 9 */}
          <section id="disclaimers">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
            <p className="text-muted-foreground mb-4 uppercase text-sm font-medium">
              UPLIFT IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
              <li>Warranties that the service will be uninterrupted, error-free, or secure</li>
              <li>Warranties regarding the accuracy, reliability, or completeness of any content</li>
              <li>Warranties regarding specific outcomes from using our services</li>
            </ul>
          </section>

          <Separator />

          {/* Section 10 */}
          <section id="liability">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Uplift shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
              <li>We are not liable for any admission decisions made by educational institutions</li>
              <li>We are not liable for any consequences of using AI-generated suggestions</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Some jurisdictions do not allow limitation of liability for certain damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          <Separator />

          {/* Section 11 */}
          <section id="indemnification">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless Uplift, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney's fees) arising from your use of the service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <Separator />

          {/* Section 12 */}
          <section id="termination">
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">By You</h3>
            <p className="text-muted-foreground mb-4">
              You may terminate your account at any time by contacting us or using the account deletion feature. Upon termination, you will lose access to your data (subject to our data retention policy).
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">By Us</h3>
            <p className="text-muted-foreground mb-4">
              We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violate these Terms</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Fail to pay applicable fees</li>
              <li>At our discretion, with reasonable notice</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Effect of Termination</h3>
            <p className="text-muted-foreground">
              Upon termination, your right to use Uplift ceases immediately. Provisions that by their nature should survive (including intellectual property, disclaimers, and limitations of liability) will remain in effect.
            </p>
          </section>

          <Separator />

          {/* Section 13 */}
          <section id="changes">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last updated" date. For significant changes, we may also notify you via email. Your continued use of Uplift after changes take effect constitutes acceptance of the modified Terms.
            </p>
          </section>

          <Separator />

          {/* Section 14 */}
          <section id="governing-law">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.
            </p>
            <p className="text-muted-foreground">
              Any disputes arising from these Terms or your use of Uplift shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in any court of competent jurisdiction.
            </p>
          </section>

          <Separator />

          {/* Section 15 */}
          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-secondary/30 p-6 rounded-lg">
              <p className="font-medium mb-2">Uplift</p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:legal@useuplift.io" className="text-primary hover:underline">legal@useuplift.io</a>
              </p>
              <p className="text-muted-foreground mt-2">
                For support inquiries: <a href="mailto:support@useuplift.io" className="text-primary hover:underline">support@useuplift.io</a>
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
