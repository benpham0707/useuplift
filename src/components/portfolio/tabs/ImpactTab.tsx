import React, { useState, useRef, useEffect } from 'react';
import { ImpactSnapshot } from '@/components/portfolio/impact/ImpactSnapshot';
import { KPIDashboard } from '@/components/portfolio/impact/KPIDashboard';
import { ImpactFramePicker } from '@/components/portfolio/impact/ImpactFramePicker';
import { ProofStrip } from '@/components/portfolio/impact/ProofStrip';
import { ImpactLedger } from '@/components/portfolio/impact/ImpactLedger';
import { ImpactQualityCheck } from '@/components/portfolio/impact/ImpactQualityCheck';
import { StorytellingGuidance } from '@/components/portfolio/impact/StorytellingGuidance';
import { ImpactDock } from '@/components/portfolio/impact/ImpactDock';
import { OverarchingInsight } from '@/components/portfolio/portfolioInsightsData';

interface ImpactTabProps {
  overarchingInsight: OverarchingInsight;
}

export const ImpactTab: React.FC<ImpactTabProps> = ({ overarchingInsight }) => {
  const insight = overarchingInsight as any;
  const [activeSection, setActiveSection] = useState('snapshot');
  
  // Refs for each section
  const snapshotRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);
  const outcomesRef = useRef<HTMLDivElement>(null);
  const initiativesRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const guidanceRef = useRef<HTMLDivElement>(null);

  const sectionRefs = {
    snapshot: snapshotRef,
    frames: framesRef,
    outcomes: outcomesRef,
    initiatives: initiativesRef,
    evidence: evidenceRef,
    quality: qualityRef,
    guidance: guidanceRef,
  };

  const handleNavigate = (sectionId: string) => {
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // Scroll spy to update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      for (const [id, ref] of Object.entries(sectionRefs)) {
        if (ref.current) {
          const { offsetTop, offsetHeight } = ref.current;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-12 pb-32">
      {/* Section 1: Impact Snapshot - Always Visible */}
      <div ref={snapshotRef} id="snapshot">
        {insight.snapshotSummary && insight.snapshotMetrics && (
          <ImpactSnapshot 
            summary={insight.snapshotSummary}
            metrics={insight.snapshotMetrics}
          />
        )}
      </div>

      {/* Section 2: Frame Your Story */}
      <div ref={framesRef} id="frames">
        {insight.impactFrames && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Frame Your Story
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose different lenses to view and present your impact. Each frame emphasizes different aspects of your work.
              </p>
            </div>
            <ImpactFramePicker frames={insight.impactFrames} />
          </div>
        )}
      </div>

      {/* Section 3: Key Outcomes */}
      <div ref={outcomesRef} id="outcomes">
        {insight.kpis && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Key Outcomes
              </h2>
              <p className="text-sm text-muted-foreground">
                Critical metrics showing real-world impact. Hover for context, click for full details.
              </p>
            </div>
            <KPIDashboard kpis={insight.kpis} />
          </div>
        )}
      </div>

      {/* Section 4: Initiative Breakdown */}
      <div ref={initiativesRef} id="initiatives">
        {insight.initiatives && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Initiative Breakdown
              </h2>
              <p className="text-sm text-muted-foreground">
                Detailed view of each initiative. Hover for preview, click for full details.
              </p>
            </div>
            <ImpactLedger initiatives={insight.initiatives} />
          </div>
        )}
      </div>

      {/* Section 5: Evidence Locker */}
      <div ref={evidenceRef} id="evidence">
        {insight.artifacts && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Evidence Locker
              </h2>
              <p className="text-sm text-muted-foreground">
                Supporting documentation, testimonials, media coverage, and data artifacts. Click to view details.
              </p>
            </div>
            <ProofStrip artifacts={insight.artifacts} />
          </div>
        )}
      </div>

      {/* Section 6: Impact Quality Check */}
      <div ref={qualityRef} id="quality">
        {insight.impactQuality && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Impact Quality Assessment
              </h2>
              <p className="text-sm text-muted-foreground">
                Evaluation across key dimensions. Hover over radar chart for details.
              </p>
            </div>
            <ImpactQualityCheck 
              dimensions={insight.impactQuality.dimensions}
              overallAssessment={insight.impactQuality.overallAssessment}
            />
          </div>
        )}
      </div>

      {/* Section 7: Storytelling Guidance */}
      <div ref={guidanceRef} id="guidance">
        {insight.storytellingGuidance && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Strategic Storytelling Guidance
              </h2>
              <p className="text-sm text-muted-foreground">
                Recommendations based on your impact data. Hover for preview, click to expand.
              </p>
            </div>
            <StorytellingGuidance insights={insight.storytellingGuidance} />
          </div>
        )}
      </div>

      {/* Dock Navigation */}
      <ImpactDock activeSection={activeSection} onNavigate={handleNavigate} />
    </div>
  );
};