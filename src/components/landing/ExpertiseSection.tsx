/**
 * Expertise & Methodology Section
 * 
 * Shows that Uplift is built with deep expertise from top counselors
 * Gives a sneak peek into the logic and understanding of good narratives
 */

import { motion } from 'motion/react';
import { 
  BookOpen, 
  Quote, 
  GraduationCap, 
  Lightbulb,
  CheckCircle,
  Users
} from 'lucide-react';

const ExpertiseSection = () => {
  const insights = [
    {
      category: "What Admissions Officers Actually Look For",
      insight: "They're not looking for the 'perfect' student. They want authenticity—moments where you show genuine thought, not impressive-sounding buzzwords.",
      source: "Insight from UC Berkeley admissions review process"
    },
    {
      category: "The #1 Mistake Students Make",
      insight: "Students tell us WHAT they did. Winners show us HOW they think. The difference? One sentence about founding a club vs. one sentence about the moment you realized leadership meant listening, not directing.",
      source: "Pattern across 500+ successful PIQ essays"
    },
    {
      category: "Why 'Show, Don't Tell' Actually Works",
      insight: "\"I paced the front of room 204, clearing my throat for the third time in thirty seconds\" beats \"I was nervous about public speaking\" every time. Concrete details make readers feel present.",
      source: "Core principle from narrative coaching methodology"
    }
  ];

  const counselorLogos = [
    { initials: "JK", name: "Julia K.", credential: "Former UC Reader" },
    { initials: "MT", name: "Michael T.", credential: "Harvard Ed.M." },
    { initials: "SC", name: "Sarah C.", credential: "Stanford Counselor" },
    { initials: "AR", name: "Amy R.", credential: "20+ Years Experience" },
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4 text-primary" />
            Our Methodology
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Built on real expertise,<br />
            <span className="text-muted-foreground">not just AI hype</span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            We consulted with counselors who've helped students get into Stanford, Harvard, MIT, and all UCs. 
            Here's a glimpse into how we think about great narratives.
          </p>
        </motion.div>

        {/* Counselor Credibility */}
        <motion.div 
          className="flex justify-center items-center gap-4 mb-16 flex-wrap"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm text-muted-foreground mr-4">Built with guidance from:</span>
          {counselorLogos.map((counselor, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 bg-background rounded-full px-3 py-1.5 border shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {counselor.initials}
              </div>
              <div className="text-left">
                <div className="text-xs font-medium">{counselor.name}</div>
                <div className="text-[10px] text-muted-foreground">{counselor.credential}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {insights.map((item, index) => (
            <motion.div
              key={index}
              className="bg-background rounded-2xl p-6 border shadow-sm relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-4">
                <Lightbulb className="h-3.5 w-3.5" />
                {item.category}
              </div>
              
              <p className="text-foreground leading-relaxed mb-6">
                "{item.insight}"
              </p>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground italic">
                  {item.source}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How We're Different */}
        <motion.div 
          className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 rounded-2xl p-8 md:p-12 border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                This isn't generic "make it more specific" feedback
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our 12-dimension rubric was built by reverse-engineering what makes essays work at elite schools. 
                Each dimension maps to a specific quality that separates competitive essays from mediocre ones.
              </p>
              
              <div className="space-y-3">
                {[
                  "Opening Hook: Does your first sentence pull readers in?",
                  "Specificity: Are you showing or just telling?",
                  "Authentic Voice: Does this sound like YOU?",
                  "Insight & Reflection: What did you actually learn?"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-background rounded-xl p-6 border shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">From Our Rubric</div>
                  <div className="text-xs text-muted-foreground">Character Development Dimension</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Detected Issue</div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Beautiful concept but lacks specific examples of how this mutual expertise actually worked in practice
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">From Your Draft</div>
                  <p className="text-sm italic text-foreground/80">
                    "We could all be the expert in the room because we could gain from each other what we lacked individually."
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-1">How to Fix</div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Add a specific moment: "When Marcus, our finance lead, got stuck on projections, I showed him how to model supply constraints from my AP Econ project..."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ExpertiseSection;
