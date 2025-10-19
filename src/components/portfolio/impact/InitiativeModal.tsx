import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Initiative } from './ImpactLedger';
import {
  Users,
  Calendar,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  Building2,
  Sparkles,
  Box,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface InitiativeModalProps {
  initiative: Initiative | null;
  isOpen: boolean;
  onClose: () => void;
  impactQuality?: {
    overallAssessment: string;
    dimensions: Array<{
      id: string;
      name: string;
      score: number;
      explanation?: string;
      suggestion?: string;
      improvements?: string[];
      status?: string;
    }>;
  };
}

const statusConfig = {
  'ongoing': { label: 'Ongoing', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  'handed-off': { label: 'Handed Off', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  'completed': { label: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
};

export const InitiativeModal: React.FC<InitiativeModalProps> = ({ initiative, isOpen, onClose, impactQuality }) => {
  if (!initiative) return null;

  const statusStyle = statusConfig[initiative.durability.status];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-3">
            <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight">
              {initiative.name}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("text-xs", statusStyle.color)}>{statusStyle.label}</Badge>
              <Separator orientation="vertical" className="h-4" />
              <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="line-clamp-1">{initiative.beneficiary.who}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {initiative.timeSpan.start}
                  <ArrowRight className="inline w-3 h-3 mx-1 text-muted-foreground" />
                  {initiative.timeSpan.end || 'Present'}
                </span>
                <span className="ml-1 text-muted-foreground">({initiative.timeSpan.duration})</span>
              </div>
              {typeof initiative.resources.volunteers === 'number' && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{initiative.resources.volunteers} volunteers</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section aria-labelledby="beneficiaries-heading" className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 id="beneficiaries-heading" className="text-sm font-semibold">Beneficiaries</h3>
              </div>
              <p className="text-sm text-foreground">{initiative.beneficiary.who}</p>
              {initiative.beneficiary.demographics && (
                <p className="text-sm text-muted-foreground mt-1">{initiative.beneficiary.demographics}</p>
              )}
            </section>

            {/* Removed separate Timeline card to avoid redundancy with header */}
          </div>

          <section aria-labelledby="outcomes-heading" className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 id="outcomes-heading" className="text-sm font-semibold">Outcomes</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">{initiative.outcome.primary}</p>
                {initiative.outcome.secondary && initiative.outcome.secondary.length > 0 && (
                  <ul className="space-y-1">
                    {initiative.outcome.secondary.map((outcome, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Evidence</div>
                {initiative.outcome.evidence.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {initiative.outcome.evidence.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                        target={link.startsWith('http') ? '_blank' : '_self'}
                        rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        <Sparkles className="w-3 h-3" /> Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No evidence linked</div>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="resources-heading" className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 id="resources-heading" className="text-sm font-semibold">Resources</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Box className="w-4 h-4" />
                  <span className="font-medium text-foreground">Funding</span>
                </div>
                <div className="text-muted-foreground">
                  {initiative.resources.funding || '—'}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium text-foreground">Partners</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {initiative.resources.partners.map((p, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                  {initiative.resources.partners.length === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              {typeof initiative.resources.volunteers === 'number' && (
                <div className="space-y-1 md:col-span-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-foreground">Volunteers</span>
                  </div>
                  <div className="text-muted-foreground">{initiative.resources.volunteers}</div>
                </div>
              )}
            </div>
          </section>

          {initiative.durability.successor && (
            <section aria-labelledby="sustainability-heading" className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 id="sustainability-heading" className="text-sm font-semibold">Sustainability</h3>
              </div>
              <p className="text-sm text-muted-foreground">{initiative.durability.successor}</p>
            </section>
          )}

          {/* Impact Quality Snapshot with "take it further" */}
          {impactQuality?.dimensions && impactQuality.dimensions.length > 0 && (
            <section aria-labelledby="quality-heading" className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 id="quality-heading" className="text-sm font-semibold">Impact Quality Snapshot</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{impactQuality.overallAssessment}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {impactQuality.dimensions.slice(0, 4).map((dim) => (
                  <div key={dim.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dim.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{dim.score}/10</span>
                    </div>
                    {dim.explanation && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{dim.explanation}</p>
                    )}
                    {dim.suggestion && (
                      <div className="text-xs">
                        <span className="font-medium text-foreground">Take it further:</span>{' '}
                        <span className="text-muted-foreground">{dim.suggestion}</span>
                      </div>
                    )}
                    {dim.improvements && dim.improvements.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {dim.improvements.slice(0, 2).map((imp, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground">{imp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};