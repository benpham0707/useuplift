import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Initiative } from './ImpactLedger';
import { Users, Calendar, Target, DollarSign, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InitiativeModalProps {
  initiative: Initiative | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  'ongoing': { label: 'Ongoing', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  'handed-off': { label: 'Handed Off', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  'completed': { label: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
};

export const InitiativeModal: React.FC<InitiativeModalProps> = ({ initiative, isOpen, onClose }) => {
  if (!initiative) return null;

  const statusStyle = statusConfig[initiative.durability.status];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">{initiative.name}</DialogTitle>
            <Badge className={cn("text-xs w-fit", statusStyle.color)}>
              {statusStyle.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Beneficiaries */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="w-4 h-4" />
              Beneficiaries
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-sm text-foreground">{initiative.beneficiary.who}</div>
              {initiative.beneficiary.demographics && (
                <div className="text-sm text-muted-foreground">
                  {initiative.beneficiary.demographics}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="w-4 h-4" />
              Timeline
            </div>
            <div className="pl-6 flex items-center gap-2 text-sm">
              <span className="text-foreground">{initiative.timeSpan.start}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground">
                {initiative.timeSpan.end || 'Present'}
              </span>
              <span className="text-muted-foreground">
                ({initiative.timeSpan.duration})
              </span>
            </div>
          </div>

          {/* Outcomes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="w-4 h-4" />
              Outcomes
            </div>
            <div className="pl-6 space-y-2">
              <div className="text-sm text-foreground font-medium">
                {initiative.outcome.primary}
              </div>
              {initiative.outcome.secondary && initiative.outcome.secondary.length > 0 && (
                <ul className="space-y-1">
                  {initiative.outcome.secondary.map((outcome, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              )}
              {initiative.outcome.evidence.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {initiative.outcome.evidence.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      className="text-xs text-primary hover:underline"
                      target={link.startsWith('http') ? '_blank' : '_self'}
                      rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      Evidence {idx + 1} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="w-4 h-4" />
              Resources
            </div>
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              {initiative.resources.funding && (
                <div>Funding: {initiative.resources.funding}</div>
              )}
              <div>Partners: {initiative.resources.partners.join(', ')}</div>
              {initiative.resources.volunteers && (
                <div>Volunteers: {initiative.resources.volunteers}</div>
              )}
            </div>
          </div>

          {/* Durability */}
          {initiative.durability.successor && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="w-4 h-4" />
                Sustainability
              </div>
              <div className="pl-6 text-sm text-muted-foreground">
                {initiative.durability.successor}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};