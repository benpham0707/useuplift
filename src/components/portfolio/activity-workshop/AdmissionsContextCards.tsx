/**
 * AdmissionsContextCards — Hover card components for admissions context.
 *
 * Provides on-demand tier definitions, AO reading process insights,
 * and school archetype information via hover cards. Replaces repetitive
 * inline text with interactive, discoverable context.
 */
import React from 'react';
import { Info } from 'lucide-react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import {
  TIER_DEFINITIONS,
  AO_READING_PROCESS,
  SCHOOL_ARCHETYPES,
} from './admissionsContextData';
import type { TierDefinition } from './admissionsContextData';

// ============================================================================
// TIER HOVER CARD
// ============================================================================

interface TierHoverCardProps {
  tier: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

const TierHoverCardInner = function TierHoverCard({ tier, children }: TierHoverCardProps) {
  const def: TierDefinition = TIER_DEFINITIONS[tier];
  const nextTierUp = tier > 1 ? TIER_DEFINITIONS[(tier - 1) as 1 | 2 | 3 | 4] : null;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center gap-0.5">
          {children}
          <Info className="h-2.5 w-2.5 opacity-30" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80">
        <div className="border-l-2 border-emerald-500 pl-3 space-y-2">
          {/* Header */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {def.label}
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              {def.definition}
            </p>
          </div>

          {/* Evidence */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Evidence Required
            </span>
            <ul className="mt-0.5 space-y-0.5">
              {def.evidence.map((item, i) => (
                <li key={i} className="text-xs text-foreground/70 flex items-start gap-1">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Admission impact */}
          <div className="rounded-md bg-emerald-50/40 dark:bg-emerald-950/20 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Admission Impact
            </span>
            <p className="text-xs text-foreground/70 mt-0.5">{def.admissionImpact}</p>
          </div>

          {/* Next tier hint */}
          {nextTierUp && (
            <p className="text-[10px] text-muted-foreground/60 italic">
              To reach {nextTierUp.label}: {nextTierUp.evidence[0].toLowerCase()}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const TierHoverCard = React.memo(TierHoverCardInner);

// ============================================================================
// AO PROCESS HOVER CARD
// ============================================================================

interface AOProcessHoverCardProps {
  topic: keyof typeof AO_READING_PROCESS;
  children: React.ReactNode;
}

const AOProcessHoverCardInner = function AOProcessHoverCard({ topic, children }: AOProcessHoverCardProps) {
  const data = AO_READING_PROCESS[topic];
  if (!data) return <>{children}</>;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center gap-0.5">
          {children}
          <Info className="h-2.5 w-2.5 opacity-30" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80">
        <div className="border-l-2 border-blue-500 pl-3 space-y-2">
          {/* Header */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {data.title}
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              {data.summary}
            </p>
          </div>

          {/* Details */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Key Insights
            </span>
            <ul className="mt-0.5 space-y-0.5">
              {data.details.map((detail, i) => (
                <li key={i} className="text-xs text-foreground/70 flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">&#8226;</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const AOProcessHoverCard = React.memo(AOProcessHoverCardInner);

// ============================================================================
// SCHOOL ARCHETYPE HOVER CARD
// ============================================================================

interface SchoolArchetypeHoverCardProps {
  archetype: keyof typeof SCHOOL_ARCHETYPES;
  children: React.ReactNode;
}

const SchoolArchetypeHoverCardInner = function SchoolArchetypeHoverCard({ archetype, children }: SchoolArchetypeHoverCardProps) {
  const data = SCHOOL_ARCHETYPES[archetype];
  if (!data) return <>{children}</>;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center gap-0.5">
          {children}
          <Info className="h-2.5 w-2.5 opacity-30" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80">
        <div className="border-l-2 border-purple-500 pl-3 space-y-2">
          {/* Header */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {data.name}
            </span>
            <p className="text-xs text-foreground/70 mt-0.5">
              {data.schools.join(', ')}
            </p>
          </div>

          {/* Values */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              What They Value
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              {data.primaryValue}
            </p>
          </div>

          {/* Ideal spike */}
          <div className="rounded-md bg-purple-50/40 dark:bg-purple-950/20 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Ideal Spike
            </span>
            <p className="text-xs text-foreground/70 mt-0.5">{data.idealSpike}</p>
          </div>

          {/* Description advice */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description Strategy
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5 font-medium">
              {data.descriptionAdvice}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const SchoolArchetypeHoverCard = React.memo(SchoolArchetypeHoverCardInner);
