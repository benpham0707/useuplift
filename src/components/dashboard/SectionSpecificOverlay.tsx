import React from 'react';
import { ComingSoonOverlay } from './ComingSoonOverlay';

interface SectionSpecificOverlayProps {
  children: React.ReactNode;
  section: 'foundation' | 'skills' | 'essays' | 'future';
  title?: string;
  description?: string;
  className?: string;
}

const sectionFeatures = {
  foundation: [
    "• Stakeholder Ecosystem Intelligence",
    "• Advanced Leadership Evolution",
    "• Technical Skills Mastery",
    "• Impact Systems Analysis"
  ],
  skills: [
    "• Soft Skills Evidence Mapping",
    "• Competency Gap Analysis", 
    "• Skills Transfer Intelligence",
    "• Professional Growth Roadmap"
  ],
  essays: [
    "• AI-Powered Essay Optimization",
    "• Multi-Platform Story Adaptation",
    "• Narrative Arc Intelligence",
    "• Application Strategy AI"
  ],
  future: [
    "• Strategic Development Pathways",
    "• Network Relationship Capital",
    "• Future Intelligence Mapping",
    "• Career Trajectory Optimization"
  ]
};

const sectionDefaults = {
  foundation: {
    title: "Advanced Foundation Intelligence",
    description: "Unlock stakeholder ecosystem mapping, leadership evolution tracking, and technical skills mastery in Expert Mode."
  },
  skills: {
    title: "Advanced Skills Intelligence", 
    description: "Unlock soft skills evidence analysis and expert competency mapping in Expert Mode."
  },
  essays: {
    title: "Advanced Essay Intelligence",
    description: "Unlock AI-powered essay optimization and multi-platform adaptation in Expert Mode."
  },
  future: {
    title: "Advanced Future Intelligence",
    description: "Unlock strategic skill development and future intelligence mapping in Expert Mode."
  }
};

export const SectionSpecificOverlay: React.FC<SectionSpecificOverlayProps> = ({
  children,
  section,
  title,
  description,
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Blur the background content */}
      <div className="blur-sm opacity-40 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay with section-specific content */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
        <div className="max-w-lg mx-auto shadow-large border-4 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-md rounded-3xl p-6 text-center space-y-4"
             style={{
               borderImage: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.8), hsl(var(--primary) / 0.8)) 1'
             }}>
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="p-3 rounded-full bg-gradient-primary text-white shadow-soft">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
            </div>
            <div className="bg-primary/10 text-primary border-primary/30 px-2 py-1 rounded-full text-xs font-medium border">
              <svg className="h-3 w-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v-3m0 0V9m0 3h3m-3 0H9m12-6a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expert Mode
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {title || sectionDefaults[section].title}
          </h3>
          
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description || sectionDefaults[section].description}
          </p>
          
          <div className="pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Coming in Expert Mode:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              {sectionFeatures[section].map((feature, index) => (
                <div key={index}>{feature}</div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Unlock advanced analysis, personalized insights, and comprehensive tools in Expert Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};