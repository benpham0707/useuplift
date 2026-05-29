/**
 * ProseCallout — renders the L3.75-generated one-line synthesis
 * ("Your strongest area: voice. Weakest: opening specificity.")
 * above the filter chips in list mode.
 *
 * Authority:
 *   - docs/ux_phases/phase_11_list_map.md §2.5 ("exactly one L3.75-
 *     generated prose line naming strongest + weakest dimensions")
 *   - docs/ux_phases/phase_11_list_map.md §3.5 forbidden-substring
 *     rule (no numeric scores, percentages, or letter grades in
 *     rendered dimension strings — fail safe).
 *   - docs/ux_phases/phase_11_list_map.md §4.4 prose-line templates.
 *
 * The forbidden-substring check is applied client-side as a
 * belt-and-suspenders defense: the server-side L3.75 prompt is
 * guardrailed, but if the model output drifts past those rails we
 * render nothing rather than expose a score.
 */

import { TYPOGRAPHY } from '../tokens';
import type { HolisticSynthesis } from '../types/profile';
import { containsForbiddenStatistic } from './listFormatting';

export interface ProseCalloutProps {
  readonly holisticSynthesis: HolisticSynthesis;
}

export function ProseCallout({ holisticSynthesis }: ProseCalloutProps) {
  const strong = holisticSynthesis.strongestDimension?.trim() ?? '';
  const weak = holisticSynthesis.weakestDimension?.trim() ?? '';

  // Phase 11 §3.5 — fail safe. If either dimension contains a forbidden
  // statistic, render nothing at all. We don't render "half the prose"
  // in that case because the LLM produced two coupled dimensions; one
  // being contaminated means the output is not trustworthy.
  if (strong && containsForbiddenStatistic(strong)) return null;
  if (weak && containsForbiddenStatistic(weak)) return null;

  // Missing-half rule: render only the available half per spec.
  let body = '';
  if (strong && weak) {
    body = `Your strongest area: ${strong}. Weakest: ${weak}.`;
  } else if (strong) {
    body = `Your strongest area: ${strong}.`;
  } else if (weak) {
    body = `Weakest: ${weak}.`;
  } else {
    return null;
  }

  return (
    <p
      // Phase 11 §3.2 token: 14px stone-600 serif-italic, maxProseCh.
      style={{
        fontFamily: TYPOGRAPHY.families.serif,
        fontSize: '14px',
        lineHeight: 1.55,
        color: 'hsl(150 8% 40%)', // sage-toned stone-600
        fontStyle: 'italic',
        margin: `0 0 12px 0`,
        padding: `0 ${TYPOGRAPHY.panelPaddingX}`,
        maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
      }}
    >
      {body}
    </p>
  );
}
