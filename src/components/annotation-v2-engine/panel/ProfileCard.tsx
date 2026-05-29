/**
 * ProfileCard — Workstream F. L3 Understanding renderer for the
 * Profile tab.
 *
 * Phase 8 §2.1 closing note + Phase 6 §2.2 orientation rule: the
 * Profile tab is the DESCRIPTIVE view of a sentence — "what is this
 * sentence doing" without any judgment ("how well"). The content comes
 * from `SentenceProfile.understanding`, NOT from the Annotation
 * (annotations carry the "how well" + teaching verdict that lives on
 * the Insights tab).
 *
 * Four collapsible subsections (default expanded):
 *   - What this sentence does   ← observedFunctions[]
 *   - Writer's intent           ← inferredIntents[]
 *   - Narrative contribution    ← narrativeContributions[]
 *   - Craft details             ← craftDetails[]
 *
 * Significant word choices render as a small pill cluster at the
 * bottom — these are concrete authorial moves the walk surfaced that
 * don't fit neatly into any of the four lenses (a tense shift, an
 * unexpected image).
 *
 * Typography is quieter than Insights (§2.6 "skim if you want"): the
 * meta line uses the same format but renders in the muted sage tone,
 * and section content uses the `strengthLine` size (14px serif) —
 * Profile is support material for the Insights tab's critique.
 *
 * NO judgment language — section labels are declarative, bullet copy
 * is the L3 walk's prose verbatim.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.1 (understanding vs
 *     analysis separation); §2.6 (typography, quieter register);
 *     §3.1 (strengthLine size for supporting observations).
 *   - docs/ux_phases/phase_6_filters_density.md §2.2 (Profile-tab gate
 *     rationale — gives this tab a "secondary view" register).
 */

import { useState } from 'react';
import { motion } from 'motion/react';

import {
  DURATION,
  EASING,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
} from '../tokens';
import type { SentenceProfile } from '../types/profile';

export interface ProfileCardProps {
  readonly sentence: SentenceProfile;
  readonly paragraphIndex: number; // 0-based display as +1
  readonly reducedMotion: boolean;
}

interface UnderstandingSection {
  readonly key:
    | 'observedFunctions'
    | 'inferredIntents'
    | 'narrativeContributions'
    | 'craftDetails';
  readonly label: string;
  readonly items: readonly string[];
}

export function ProfileCard({
  sentence,
  paragraphIndex,
  reducedMotion,
}: ProfileCardProps): JSX.Element {
  const paragraphNumber = paragraphIndex + 1;
  const sentenceNumber = sentence.indexWithinParagraph + 1;

  const tierCssVar = TIER_CSS_VAR[sentence.tier];
  // Phase 8 §2.6 — meta line on the Profile tab uses a softer tint
  // ("different color tint — muted") so the tab reads as secondary.
  const tierColor =
    sentence.tier === 'FUNCTIONAL'
      ? `hsl(var(${tierCssVar}) / 0.55)`
      : `hsl(var(${tierCssVar}) / 0.80)`;
  const tierLabel = TIER_META[sentence.tier].label;

  const sections: UnderstandingSection[] = [
    {
      key: 'observedFunctions',
      label: 'What this sentence does',
      items: sentence.understanding.observedFunctions,
    },
    {
      key: 'inferredIntents',
      label: "Writer's intent",
      items: sentence.understanding.inferredIntents,
    },
    {
      key: 'narrativeContributions',
      label: 'Narrative contribution',
      items: sentence.understanding.narrativeContributions,
    },
    {
      key: 'craftDetails',
      label: 'Craft details',
      items: sentence.understanding.craftDetails,
    },
  ];

  return (
    <section
      aria-label={`Profile for paragraph ${paragraphNumber}, sentence ${sentenceNumber}`}
      style={{
        paddingTop: TYPOGRAPHY.panelPaddingTop,
        paddingLeft: TYPOGRAPHY.panelPaddingX,
        paddingRight: TYPOGRAPHY.panelPaddingX,
        paddingBottom: TYPOGRAPHY.panelPaddingBottom,
        maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
        color: 'oklch(0.28 0.02 240)',
      }}
    >
      {/* Muted meta line — Phase 8 §2.6 "different color tint". */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: TYPOGRAPHY.size.meta,
          fontWeight: TYPOGRAPHY.weight.medium,
          lineHeight: TYPOGRAPHY.lineHeight.sansTight,
          letterSpacing: TYPOGRAPHY.tracking.meta,
          color: 'hsl(220 10% 55%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{`\u00B6${paragraphNumber}`}</span>
        <span style={{ opacity: 0.4 }}>{'\u00B7'}</span>
        <span>{`sentence ${sentenceNumber}`}</span>
        <span style={{ opacity: 0.4 }}>{'\u00B7'}</span>
        <span
          style={{
            color: tierColor,
            fontWeight: TYPOGRAPHY.weight.semibold,
            letterSpacing: TYPOGRAPHY.tracking.tierWord,
            textTransform: 'uppercase',
          }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Four L3 subsections. Each is collapsible (default expanded). */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {sections.map((section) => (
          <UnderstandingSectionView
            key={section.key}
            section={section}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Significant word choices — small pill cluster. */}
      {sentence.understanding.significantChoices.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.sectionLabel,
              fontWeight: TYPOGRAPHY.weight.semibold,
              letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
              textTransform: 'uppercase',
              color: 'hsl(220 20% 40%)',
              marginBottom: 8,
            }}
          >
            Significant choices
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {sentence.understanding.significantChoices.map((choice, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'hsl(220 15% 96%)',
                  border: '1px solid hsl(220 15% 90%)',
                  fontFamily: TYPOGRAPHY.families.sans,
                  fontSize: TYPOGRAPHY.size.pillInline,
                  fontWeight: TYPOGRAPHY.weight.medium,
                  letterSpacing: TYPOGRAPHY.tracking.pill,
                  color: 'hsl(220 15% 35%)',
                }}
              >
                {choice}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Collapsible subsection.
// ---------------------------------------------------------------------------

function UnderstandingSectionView({
  section,
  reducedMotion,
}: {
  readonly section: UnderstandingSection;
  readonly reducedMotion: boolean;
}) {
  const [open, setOpen] = useState(true);
  const isEmpty = section.items.length === 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => !isEmpty && setOpen((v) => !v)}
        aria-expanded={open}
        disabled={isEmpty}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: isEmpty ? 'default' : 'pointer',
          textAlign: 'left',
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: TYPOGRAPHY.size.sectionLabel,
          fontWeight: TYPOGRAPHY.weight.semibold,
          letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
          textTransform: 'uppercase',
          color: isEmpty ? 'hsl(220 10% 70%)' : 'hsl(220 20% 40%)',
          opacity: isEmpty ? 0.65 : 1,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
            transition: reducedMotion ? 'none' : 'transform 140ms ease-out',
            opacity: 0.6,
          }}
        >
          {'\u203A'}
        </span>
        <span>{section.label}</span>
        {isEmpty ? <span style={{ opacity: 0.6 }}> — none noted</span> : null}
      </button>

      {open && !isEmpty ? (
        <motion.ul
          initial={reducedMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  duration: DURATION.contentCrossfade / 1000,
                  ease: EASING.contentCrossfade,
                }
          }
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '8px 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            overflow: 'hidden',
          }}
        >
          {section.items.map((item, i) => (
            <li
              key={i}
              style={{
                position: 'relative',
                paddingLeft: 14,
                fontFamily: TYPOGRAPHY.families.serif,
                fontSize: TYPOGRAPHY.size.strengthLine,
                fontWeight: TYPOGRAPHY.weight.regular,
                lineHeight: TYPOGRAPHY.lineHeight.serifStrength,
                color: 'oklch(0.28 0.02 240)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '0.55em',
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: 'hsl(220 15% 60%)',
                }}
              />
              {item}
            </li>
          ))}
        </motion.ul>
      ) : null}
    </div>
  );
}
