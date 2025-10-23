import React, { useState, useRef, useEffect } from 'react';
import { ImpactSnapshot } from '@/components/portfolio/impact/ImpactSnapshot';
import { KPIDashboard } from '@/components/portfolio/impact/KPIDashboard';
import { ImpactFramePicker } from '@/components/portfolio/impact/ImpactFramePicker';
import { ProofStrip } from '@/components/portfolio/impact/ProofStrip';
import { ImpactLedger } from '@/components/portfolio/impact/ImpactLedger';
import { ImpactQualityCheck } from '@/components/portfolio/impact/ImpactQualityCheck';
import { ImpactDock } from '@/components/portfolio/impact/ImpactDock';
import { OverarchingInsight } from '@/components/portfolio/portfolioInsightsData';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, BarChart3, FolderOpen, Lock, CheckCircle, Lightbulb } from 'lucide-react';

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
  

  const sectionRefs = {
    snapshot: snapshotRef,
    frames: framesRef,
    outcomes: outcomesRef,
    initiatives: initiativesRef,
    evidence: evidenceRef,
    quality: qualityRef,
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
    <div className="space-y-6 pb-32">
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
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
            <CardContent className="p-7 md:p-8 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Frame Your Story
                  </h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Choose different lenses to view and present your impact. Each frame emphasizes different aspects of your work.
                </p>
              </div>
              <ImpactFramePicker frames={insight.impactFrames} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 3: Key Outcomes */}
      <div ref={outcomesRef} id="outcomes">
        {insight.kpis && (
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
            <CardContent className="p-7 md:p-8 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Key Outcomes
                  </h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Critical metrics showing real-world impact. Hover for context, click for full details.
                </p>
              </div>
              <KPIDashboard kpis={insight.kpis} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 4: Initiative Breakdown */}
      <div ref={initiativesRef} id="initiatives">
        {insight.initiatives && (
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
            <CardContent className="p-7 md:p-8 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Initiative Breakdown
                  </h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Detailed view of each initiative. Hover for preview, click for full details.
                </p>
              </div>
              <ImpactLedger initiatives={insight.initiatives} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 5: Evidence Locker */}
      <div ref={evidenceRef} id="evidence">
        {insight.artifacts && (
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
            <CardContent className="p-7 md:p-8 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Evidence Locker
                  </h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Supporting documentation, testimonials, media coverage, and data artifacts. Click to view details.
                </p>
              </div>
              <ProofStrip artifacts={insight.artifacts} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 6: Impact Quality Check */}
      <div ref={qualityRef} id="quality">
        {insight.impactQuality && (
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
            <CardContent className="p-7 md:p-8 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Impact Quality Assessment
                  </h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Evaluation across key dimensions. Hover over radar chart for details.
                </p>
              </div>
              <ImpactQualityCheck 
                dimensions={insight.impactQuality.dimensions}
                overallAssessment={insight.impactQuality.overallAssessment}
              />
            </CardContent>
          </Card>
        )}
      </div>

      

      {/* Dock Navigation */}
      <ImpactDock activeSection={activeSection} onNavigate={handleNavigate} />
    </div>
  );
};