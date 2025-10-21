import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink, Gauge, Building2, Info, PencilLine, ClipboardList, CheckCircle2, TriangleAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { RecognitionItem } from './RecognitionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NarrativeFitWorkshop } from './narrative-fit/NarrativeFitWorkshop';

interface RecognitionModalProps {
  recognition: RecognitionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-muted-foreground';
};

export const RecognitionModal: React.FC<RecognitionModalProps> = ({
  recognition,
  open,
  onOpenChange
}) => {
  if (!recognition) return null;

  const { scores } = recognition;
  const scoreColor = getScoreColor(scores.impressiveness.overall);

  const buildImpressivenessOverview = () => {
    const parts: string[] = [];
    parts.push(`This recognition earns an overall impressiveness score of ${scores.impressiveness.overall.toFixed(1)}/10.`);
    if (recognition.selectivity) {
      const rate = (recognition.selectivity.acceptanceRate * 100).toFixed(1);
      parts.push(`Selectivity is ${rate}% (${recognition.selectivity.description}).`);
    }
    parts.push(`Issuer prestige is rated ${scores.impressiveness.breakdown.issuerPrestige.toFixed(1)}/10 and field scale is ${scores.impressiveness.breakdown.fieldScale.toFixed(1)}/10.`);
    return parts.join(' ');
  };

  const getTierSummary = (overall: number) => {
    if (overall >= 9) return { label: 'Exceptional', context: 'top few percent of high school recognitions' };
    if (overall >= 8) return { label: 'Top-tier', context: 'well above most honors listed by applicants' };
    if (overall >= 7) return { label: 'Strong', context: 'notable and above average among peers' };
    return { label: 'Moderate', context: 'competitive but common in selective applicant pools' };
  };

  const getPercentileBand = (overall: number) => {
    if (overall >= 9.5) return '≈ top 1-2%';
    if (overall >= 9) return '≈ top 3-5%';
    if (overall >= 8.5) return '≈ top 6-10%';
    if (overall >= 8) return '≈ top 11-15%';
    if (overall >= 7.5) return '≈ top 20-25%';
    if (overall >= 7) return '≈ top 30%';
    return '≈ top 50%';
  };

  const buildComparativeText = () => {
    const { overall, breakdown } = scores.impressiveness;
    const tier = getTierSummary(overall);
    const pieces: string[] = [];
    pieces.push(`${tier.label} relative standing — ${tier.context}.`);
    if (recognition.selectivity) {
      pieces.push(`Selectivity at ${(recognition.selectivity.acceptanceRate * 100).toFixed(1)}% places this recognition among the more competitive awards in its category.`);
    } else {
      pieces.push(`Selectivity is inferred from category norms and comparable recognitions.`);
    }
    const prestigeLevel = breakdown.issuerPrestige >= 9 ? 'elite' : breakdown.issuerPrestige >= 8 ? 'strong' : breakdown.issuerPrestige >= 7 ? 'credible' : 'emerging';
    pieces.push(`Issuer prestige is ${prestigeLevel} (${breakdown.issuerPrestige.toFixed(1)}/10), and field scale indicates ${(breakdown.fieldScale >= 8 ? 'broad, high-participation' : breakdown.fieldScale >= 7 ? 'large' : 'focused')} competition (${breakdown.fieldScale.toFixed(1)}/10).`);
    return pieces.join(' ');
  };

  const buildOfficerImplication = () => {
    const overall = scores.impressiveness.overall;
    const tier = getTierSummary(overall).label.toLowerCase();
    const prestige = scores.impressiveness.breakdown.issuerPrestige;
    const field = scores.impressiveness.breakdown.fieldScale;
    const sel = recognition.selectivity ? `${(recognition.selectivity.acceptanceRate * 100).toFixed(1)}% acceptance` : null;

    const fieldRead = field >= 8 ? 'broad, high-participation field' : field >= 7 ? 'large field' : 'focused field';
    const prestigeRead = prestige >= 9 ? 'elite issuer' : prestige >= 8 ? 'high-prestige issuer' : prestige >= 7 ? 'credible issuer' : 'emerging issuer';

    const leadTreatment = overall >= 9 ? 'lead credential' : overall >= 8 ? 'primary supporting credential' : overall >= 7 ? 'supporting credential' : 'context credential';

    const s1 = `Reads as a ${tier} distinction and will be handled as a ${leadTreatment} in file.`;
    const s2 = `From a ${prestigeRead}${sel ? ` with ${sel}` : ''}, it signals external benchmarking in a ${fieldRead}, not merely school-level recognition.`;
    const s3 = overall >= 9
      ? 'Frames the applicant as operating at a competitive, verified standard; reviewers expect corroboration (brief press or recommender mention) rather than lengthy justification.'
      : overall >= 8
      ? 'Frames the applicant as competitively validated; reviewers will look for concise evidence of scope and outcomes to calibrate impact.'
      : overall >= 7
      ? 'Frames the applicant as credible in the space; reviewers will weight context and longitudinal engagement to distinguish from common honors.'
      : 'Adds context but is unlikely to differentiate; reviewers will look for concrete results or leadership pairing to elevate significance.';

    return `${s1} ${s2} ${s3}`;
  };

  const getPositionVerdict = () => {
    const overall = scores.impressiveness.overall;
    const align = scores.narrativeFit.spineAlignment;
    if (overall >= 9 && align >= 70) {
      return { label: 'Flagship candidate', level: 'flagship', rationale: 'very high impressiveness paired with strong relevance to the academic narrative' };
    }
    if (overall >= 8 && align >= 55) {
      return { label: 'Primary supporting (bridge)', level: 'bridge', rationale: 'strong external validation with good thematic fit' };
    }
    if (overall >= 7 && align >= 40) {
      return { label: 'Supporting credential', level: 'support', rationale: 'credible achievement that adds validation but does not define the narrative' };
    }
    if (align < 35) {
      return { label: 'Low relevance (footnote)', level: 'footnote', rationale: 'impact is difficult to connect to intended major or story' };
    }
    return { label: 'Context credential', level: 'context', rationale: 'helpful context but unlikely to influence a committee decision by itself' };
  };

  const buildUpgradeAdvice = () => {
    const { breakdown } = scores.impressiveness;
    const align = scores.narrativeFit.spineAlignment;
    const suggestions: string[] = [];
    if (align < 60) {
      suggestions.push('Increase relevance: tie outcomes directly to intended major (e.g., project spin‑off, research continuation, or domain‑specific application).');
    }
    if (breakdown.issuerPrestige < 8.5) {
      suggestions.push('Pursue a higher‑prestige stage or adjacent competition governed by a recognized body.');
    }
    if (breakdown.selectivity < 8) {
      suggestions.push('Target a next tier with lower acceptance and larger field to signal competitive benchmarking.');
    }
    return suggestions.length ? suggestions.join(' ') : 'Maintain trajectory and document outcomes; current positioning is already strong.';
  };

  const buildSelectivityInsight = () => {
    const s = scores.impressiveness.breakdown.selectivity;
    if (recognition.selectivity) {
      const rate = (recognition.selectivity.acceptanceRate * 100).toFixed(1);
      const scale = (typeof recognition.selectivity.applicants === 'number') ? ` from ${recognition.selectivity.applicants.toLocaleString()} applicants` : '';
      return `Scored ${s.toFixed(1)}/10 due to ${rate}% acceptance${scale}. This indicates success against a large competitive pool, elevating perceived rigor.`;
    }
    return `Scored ${s.toFixed(1)}/10 based on category norms and comparator awards; competitiveness exceeds typical school-level honors.`;
  };

  const buildPrestigeInsight = () => {
    const p = scores.impressiveness.breakdown.issuerPrestige;
    const band = p >= 9 ? 'elite' : p >= 8 ? 'high-prestige' : p >= 7 ? 'credible' : 'emerging';
    return `Scored ${p.toFixed(1)}/10 given a ${band} issuer (${recognition.issuer}). Recognitions from stronger issuers carry higher external credibility in committee review.`;
  };

  const buildRelevanceInsight = () => {
    const align = scores.narrativeFit.spineAlignment;
    const themes = (scores.narrativeFit.themeSupport || []).slice(0, 2);
    const themesText = themes.length ? `, reinforcing ${themes.join(' and ')}` : '';
    return `High alignment at ${align}%${themesText}. This makes it easy for an admissions officer to connect the achievement to the academic narrative and intended major.`;
  };

  // Narrative Fit: user-authored draft + strict rubric + feedback stored per recognition
  const storageKey = `narrative_fit_${recognition.id}`;
  type StoredNarrative = {
    draft: string;
    lastUpdated: number;
  };
  const getStored = (): StoredNarrative | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) as StoredNarrative : null;
    } catch {
      return null;
    }
  };

  const defaultMockDraft = `${recognition.name}. I led a small team to build scheduling and onboarding for our program; as a result, attendance stabilized at 76% over 18 months. We served 118 students weekly across two schools. This recognition validates outcomes central to my public‑interest technology focus.`;
  const [draft, setDraft] = React.useState<string>(getStored()?.draft ?? defaultMockDraft);
  const draftRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    try {
      const existing = getStored();
      if (existing && existing.draft !== draft) {
        // keep latest from storage if different on open (e.g., other tab edits)
        setDraft(existing.draft);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const persistDraft = (next: string) => {
    setDraft(next);
    try {
      const payload: StoredNarrative = { draft: next, lastUpdated: Date.now() };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore persistence errors
    }
  };

  // Apply helpers: insert at cursor or replace excerpt
  const insertAtCursor = (text: string) => {
    const el = draftRef.current;
    if (!el) {
      persistDraft((draft ? draft + (draft.endsWith(' ') ? '' : ' ') : '') + text);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    const needsSpaceBefore = before && !/\s$/.test(before);
    const needsSpaceAfter = after && !/^\s/.test(after);
    const next = `${before}${needsSpaceBefore ? ' ' : ''}${text}${needsSpaceAfter ? ' ' : ''}${after}`;
    persistDraft(next);
    // Restore cursor just after inserted text
    requestAnimationFrame(() => {
      try {
        const pos = (before.length + (needsSpaceBefore ? 1 : 0) + text.length + (needsSpaceAfter ? 1 : 0));
        el.setSelectionRange(pos, pos);
        el.focus();
      } catch {}
    });
  };

  const replaceExcerptOnce = (excerpt: string, replacement: string) => {
    if (!excerpt || !draft) {
      insertAtCursor(replacement);
      return;
    }
    const idx = draft.indexOf(excerpt);
    if (idx === -1) {
      insertAtCursor(replacement);
      return;
    }
    const before = draft.slice(0, idx);
    const after = draft.slice(idx + excerpt.length);
    const next = `${before}${replacement}${after}`;
    persistDraft(next);
    requestAnimationFrame(() => {
      const el = draftRef.current;
      if (!el) return;
      try {
        const start = before.length;
        const end = start + replacement.length;
        el.setSelectionRange(start, end);
        el.focus();
      } catch {}
    });
  };

  // Strict Ivy-level rubric: 5 criteria, each 0-10 with weight; overall as weighted average
  type Rubric = {
    criterion: string;
    description: string;
    weight: number; // 0-1
    score: number; // 0-10
    advice: string;
  };

  const computeRubric = (text: string): Rubric[] => {
    const length = text.trim().length;
    const hasNumbers = /\b(\d{1,3}(,\d{3})*|\d+(\.\d+)?%|\+?\d+\s?(pts|point|hours|students|people|years))\b/i.test(text);
    const hasCauseEffect = /(so that|which led to|resulted in|therefore|consequently|as a result)/i.test(text);
    const hasSpecificRole = /(I led|I designed|I built|I researched|I coordinated|as director|as founder|as captain)/i.test(text);
    const hasReflection = /(I learned|I realized|I discovered|this taught me|I grew|I changed|I now)/i.test(text);
    const avoidsBuzz = /(passionate|world[- ]class|life[- ]changing|dream|once in a lifetime|unparalleled)/i.test(text);
    const fitTerms = (scores.narrativeFit.themeSupport || []).some(t => new RegExp(t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(text));

    const criteria: Rubric[] = [
      {
        criterion: 'Thematic Fit to Academic Spine',
        description: 'Direct relevance to intended major/themes; connects recognition to core narrative.',
        weight: 0.28,
        score: Math.min(10, Math.max(0, Math.round((scores.narrativeFit.spineAlignment / 10) + (fitTerms ? 1 : 0)))) ,
        advice: fitTerms ? 'Maintain explicit tie-ins to primary themes.' : 'Name the theme explicitly and connect outcomes to that theme in one line.'
      },
      {
        criterion: 'Evidence & Specificity',
        description: 'Concrete metrics, scope, selectivity, and external validation.',
        weight: 0.22,
        score: Math.min(10, (hasNumbers ? 8.5 : 5) + (recognition.selectivity ? 1.5 : 0)),
        advice: hasNumbers ? 'Numbers look solid—lead with the strongest metric.' : 'Add 1-2 hard numbers (acceptance rate, beneficiaries, duration) to anchor claims.'
      },
      {
        criterion: 'Role Clarity & Agency',
        description: 'Crisp statement of your role, responsibilities, and decision-making.',
        weight: 0.18,
        score: hasSpecificRole ? 8.5 : 5.5,
        advice: hasSpecificRole ? 'Keep first-person verbs up front for agency.' : 'Add a direct clause: "I led X", "I designed Y", "I secured Z".'
      },
      {
        criterion: 'Causality & Reflection',
        description: 'Explains cause→effect and articulates learning or growth.',
        weight: 0.17,
        score: (hasCauseEffect ? 8 : 6) + (hasReflection ? 1 : 0),
        advice: hasCauseEffect && hasReflection ? 'Good causal clarity and learning dimension.' : 'Add one sentence: what changed because of you, and what you learned.'
      },
      {
        criterion: 'Tone & Economy',
        description: 'Selective, non-grandiose, avoids filler; ~80–180 words.',
        weight: 0.15,
        score: Math.max(4, Math.min(10, (length >= 80 && length <= 220 ? 8.5 : 6.5) - (avoidsBuzz ? 0 : 1.5))),
        advice: avoidsBuzz ? 'Tone is professional. Consider tightening phrasing.' : 'Remove buzzwords; replace with one precise metric or action verb.'
      }
    ];

    return criteria.map(c => ({ ...c, score: Math.max(0, Math.min(10, Number(c.score.toFixed(1)))) }));
  };

  const rubric = computeRubric(draft || '');
  const weightedOverall = Math.max(0, Math.min(10, Number((rubric.reduce((acc, r) => acc + r.score * r.weight, 0) / rubric.reduce((a, r) => a + r.weight, 0)).toFixed(1))));

  const colorForScore = (s: number) => {
    if (s >= 9) return 'text-amber-600 dark:text-amber-400';
    if (s >= 8) return 'text-green-600 dark:text-green-400';
    if (s >= 7) return 'text-blue-600 dark:text-blue-400';
    return 'text-muted-foreground';
  };

  const labelForScore = (s: number) => {
    if (s >= 9) return 'Excellent';
    if (s >= 8) return 'Strong';
    if (s >= 7) return 'Developing';
    return 'Needs work';
  };

  // Expandable rubric helpers
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  function buildCriterionSuggestions(criterion: string, text: string, rec: RecognitionItem): string[] {
    const items: string[] = [];
    if (criterion.includes('Thematic Fit')) {
      if (!(scores.narrativeFit.themeSupport || []).some(t => new RegExp(t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(text))) {
        items.push('Name the core theme explicitly (e.g., Technology for Good) in one clause.');
      }
      if (!/(intended|major|focus|spine|theme)/i.test(text)) {
        items.push('State how this recognition reinforces your academic focus or spine.');
      }
    } else if (criterion.includes('Evidence')) {
      if (rec.selectivity && !/(top|accepted|applicants|acceptance)/i.test(text)) {
        const rate = pct(rec.selectivity.acceptanceRate);
        items.push(`Add selectivity: e.g., "Top ${rec.selectivity.accepted} of ${rec.selectivity.applicants} (${rate})".`);
      }
      if (!/(\d|percent|students|hours|months|years)/i.test(text)) {
        items.push('Add 1–2 hard numbers (beneficiaries, improvement, duration).');
      }
    } else if (criterion.includes('Role Clarity')) {
      if (!/(I\s+(led|built|designed|researched|coordinated|founded))/i.test(text)) {
        items.push('Use first‑person action verbs to state your agency (e.g., I led, I built).');
      }
      items.push('State 1 decision you made or process you owned.');
    } else if (criterion.includes('Causality')) {
      if (!/(resulted in|which led to|so that|therefore|as a result)/i.test(text)) {
        items.push('Add a cause→effect connector ("which led to…").');
      }
      if (!/(I learned|I realized|this taught me)/i.test(text)) {
        items.push('Add one reflective clause about what you learned.');
      }
    } else if (criterion.includes('Tone')) {
      if (text.length > 240) items.push('Tighten to ~80–180 words; remove clauses that don’t add evidence.');
      if (/(passionate|world[- ]class|life[- ]changing|dream|unparalleled)/i.test(text)) items.push('Replace buzzwords with one precise metric or action.');
    }
    return items;
  }

  

  // Multi-issue, multi-edit suggestions with quoted excerpts from user draft
  type CriterionIssue = {
    title: string;
    excerpt: string; // quoted from draft when possible
    reason: string; // why this weakens the criterion
    suggestions: Array<{ edit: string; rationale: string }>; // multiple exact edits with rationale
  };

  const splitSentences = (t: string) => (t || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const findSentence = (t: string, re: RegExp) => splitSentences(t).find(s => re.test(s));
  const cleanExcerpt = (s?: string) => (s ? s.trim() : '');
  const excerptFallback = (text: string) => {
    const sentences = splitSentences(text);
    const first = sentences[0] || text;
    return (first || '').slice(0, 220).trim();
  };

  // Heuristic tags that describe how a suggestion would change the draft
  function inferChangeTags(text: string): string[] {
    const tags: string[] = [];
    if (/(intended|major|focus|spine|theme)/i.test(text)) tags.push('names academic focus');
    if (/(Top\s*\d+\/|%|accepted|applicants)/i.test(text)) tags.push('adds selectivity metric');
    if (/(\d|percent|students|hours|months|years)/.test(text)) tags.push('adds hard number');
    if (/(I\s+(led|built|designed|researched|coordinated|founded))/i.test(text)) tags.push('clarifies agency');
    if (/(which led to|as a result|resulted in|so that)/i.test(text)) tags.push('adds cause→effect');
    if (text.length < 200) tags.push('tightens phrasing');
    return Array.from(new Set(tags));
  }

  function buildCriterionIssues(criterion: string, text: string, rec: RecognitionItem): CriterionIssue[] {
    const issues: CriterionIssue[] = [];

    if (criterion.includes('Thematic Fit')) {
      const themes = scores.narrativeFit.themeSupport || [];
      const theme0 = themes[0] || 'primary theme';
      const themeRe = new RegExp(theme0.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const missingTheme = !themeRe.test(text);
      if (missingTheme) {
        const ex = cleanExcerpt(findSentence(text, /\b(recognition|award|finalist|winner|honor|program)\b/i) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'Theme not explicit',
          excerpt: ex,
          reason: 'Officers should not infer the connection—make the academic spine explicit.',
          suggestions: [
            { edit: `This recognition directly reinforces my ${theme0} narrative.`, rationale: 'Names the exact spine so the reader doesn’t have to infer thematic fit.' },
            { edit: '… supporting my intended major in computer science.', rationale: 'Places the credential inside your academic direction in the same breath.' },
            { edit: '… which advances my public‑interest technology focus.', rationale: 'Explicit bridge language connects credential to the thematic spine.' }
          ]
        });
      }
      if (!/(intended|major|focus|spine|theme)/i.test(text)) {
        const ex = cleanExcerpt(findSentence(text, /\b(I|my)\b/i) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'No academic focus named',
          excerpt: ex,
          reason: 'Readers need the explicit link to your academic direction in the same breath.',
          suggestions: [
            { edit: '… supporting my intended major in computer science.', rationale: 'Makes the academic direction explicit, aiding quick calibration.' },
            { edit: '… central to my public‑interest technology focus.', rationale: 'Names the spine; strengthens thematic coherence.' },
            { edit: `${rec.name}. I pursue ${theme0} as my academic spine.`, rationale: 'Rewrites opener to pair credential with thematic statement.' }
          ]
        });
      }
    }

    if (criterion.includes('Evidence')) {
      if (rec.selectivity && !/(top|accepted|applicants|acceptance|%)/i.test(text)) {
        const rate = pct(rec.selectivity.acceptanceRate);
        const ex = cleanExcerpt(findSentence(text, new RegExp(rec.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'Selectivity missing',
          excerpt: ex,
          reason: 'Without competitive context, officers can’t calibrate rigor quickly.',
          suggestions: [
            { edit: `Top ${rec.selectivity.accepted} of ${rec.selectivity.applicants} (${rate}).`, rationale: 'Numerical context instantly calibrates rigor.' },
            { edit: `${rec.name} (Top ${rec.selectivity.accepted}/${rec.selectivity.applicants}, ${rate}).`, rationale: 'Inline parenthetical keeps context attached to the credential.' },
            { edit: 'National finalist among a large field; highly selective evaluation.', rationale: 'If numbers are unknown, gives a credible tier read for officers.' }
          ]
        });
      }
      if (!/(\d|percent|students|hours|months|years)/i.test(text)) {
        const ex = cleanExcerpt(findSentence(text, /\b(I|we)\b/i) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'No hard numbers',
          excerpt: ex,
          reason: 'Officer reads prioritize quantification; unquantified claims read soft.',
          suggestions: [
            { edit: 'Served 118 students weekly across two schools.', rationale: 'Beneficiary counts are high-signal and easy to scan.' },
            { edit: 'Retention improved by 12 points semester-over-semester.', rationale: 'Outcome deltas demonstrate efficacy, not just activity.' },
            { edit: '18 months continuous operation with documented handoff.', rationale: 'Duration signals durability and program maturity.' }
          ]
        });
      }
    }

    if (criterion.includes('Role Clarity')) {
      if (!/(I\s+(led|built|designed|researched|coordinated|founded))/i.test(text)) {
        const ex = cleanExcerpt(findSentence(text, /\b(we|the team|it)\b/i) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'Agency unclear',
          excerpt: ex,
          reason: 'First‑person verbs clarify ownership; passive phrasing dilutes credit.',
          suggestions: [
            { edit: 'I led platform design and school partnerships.', rationale: 'Direct first-person agency clarifies ownership.' },
            { edit: 'I coordinated 19 peer tutors and authored the handoff documentation.', rationale: 'Pairs leadership with durable artifacts; reads as mature execution.' },
            { edit: 'I standardized onboarding and scheduling to improve reliability.', rationale: 'Names a decision you made; shows judgment and process ownership.' }
          ]
        });
      }
    }

    if (criterion.includes('Causality')) {
      if (!/(resulted in|which led to|so that|therefore|as a result)/i.test(text)) {
        const ex = cleanExcerpt(findSentence(text, /\b(I|my)\b/i) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'Missing cause→effect',
          excerpt: ex,
          reason: 'Officers need a direct line from action to outcome to gauge efficacy.',
          suggestions: [
            { edit: '… which led to a 12‑point retention increase.', rationale: 'Explicit causal connector ties action to measurable outcome.' },
            { edit: '… so that students could reliably attend matched sessions.', rationale: 'Explains beneficiary mechanism, not just your action.' },
            { edit: 'As a result, attendance stabilized at 76%.', rationale: 'Starts a sentence with the result to foreground impact.' }
          ]
        });
      }
      if (!/(I learned|I realized|this taught me)/i.test(text)) {
        const ex = cleanExcerpt(findSentence(text, /\b(I|my)\b/i) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'No reflection',
          excerpt: ex,
          reason: 'Selective read rewards metacognition; a single clause demonstrates maturity.',
          suggestions: [
            { edit: 'This taught me to measure outcomes and design for durability.', rationale: 'Shows learning that generalizes to future work; reads mature.' },
            { edit: 'I realized credibility rises when evidence leads, not adjectives.', rationale: 'Signals admissions-savvy reasoning about proof and rhetoric.' },
            { edit: 'I now prioritize standardization before scale.', rationale: 'Converts learning into a concrete decision rule.' }
          ]
        });
      }
    }

    if (criterion.includes('Tone')) {
      const buzz = text.match(/\b(passionate|world[- ]class|life[- ]changing|dream|unparalleled)\b/gi) || [];
      if (buzz.length) {
        const word = buzz[0];
        const ex = cleanExcerpt(findSentence(text, new RegExp(word, 'i')) || splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'Buzzword without evidence',
          excerpt: ex,
          reason: 'Adjectives without numbers slow credibility; use a metric instead.',
          suggestions: [
            { edit: ex.replace(new RegExp(word, 'i'), 'served 118 students weekly'), rationale: 'Swaps vague descriptor for a concrete beneficiary metric.' },
            { edit: `${rec.name} — Top ${(rec.selectivity?.accepted ?? '—')}/${(rec.selectivity?.applicants ?? '—')} (${rec.selectivity ? pct(rec.selectivity.acceptanceRate) : 'highly selective'}).`, rationale: 'Leads with selectivity to immediately anchor rigor.' },
            { edit: 'Reduced coordinator admin time by 3.5 hours/week.', rationale: 'Pairs action with number; stronger than an adjective.' }
          ]
        });
      }
      if (text.length > 240) {
        const ex = cleanExcerpt(splitSentences(text)[0]) || excerptFallback(text);
        issues.push({
          title: 'Too long for officer scan',
          excerpt: ex,
          reason: '80–180 words is the sweet spot for quick file reads.',
          suggestions: [
            { edit: `${rec.name}. I led platform design; served 118 students weekly. As a result, retention improved 12 points; this taught me to design for durability.`, rationale: '3-sentence structure optimized for skimmability with numbers and learning.' },
            { edit: `${rec.name} (Top ${(rec.selectivity?.accepted ?? '—')}/${(rec.selectivity?.applicants ?? '—')}). I coordinated 19 tutors; standardized onboarding. Attendance stabilized at 76%.`, rationale: 'Keeps selectivity inline and focuses each sentence on a single idea.' },
            { edit: `${rec.name}. Built scheduling to reduce friction; 18 months continuous operation. I now prioritize standardization before scale.`, rationale: 'Compresses mechanism + duration + reflection into compact lines.' }
          ]
        });
      }
    }

    return issues;
  }

  // Per-criterion issue navigation state
  const [issueIndexByCriterion, setIssueIndexByCriterion] = React.useState<Record<string, number>>({});
  const getIssueIndex = (key: string, len: number) => {
    const idx = issueIndexByCriterion[key] ?? 0;
    return Math.max(0, Math.min(Math.max(0, len - 1), idx));
  };
  const setIssueIndex = (key: string, next: number, len: number) => {
    setIssueIndexByCriterion(prev => ({ ...prev, [key]: Math.max(0, Math.min(Math.max(0, len - 1), next)) }));
  };

  // Per-issue suggested edit index (regenerate button cycles through options)
  const [editIndexByIssue, setEditIndexByIssue] = React.useState<Record<string, number>>({});
  const getEditIndex = (key: string, len: number) => Math.max(0, Math.min(Math.max(0, len - 1), editIndexByIssue[key] ?? 0));
  const setEditIndex = (key: string, next: number, len: number) => setEditIndexByIssue(prev => ({ ...prev, [key]: Math.max(0, Math.min(Math.max(0, len - 1), next)) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-3xl font-extrabold leading-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {recognition.name}
              </DialogTitle>
              <div className="text-base text-muted-foreground">
                {recognition.issuer} • {recognition.date}
              </div>
            </div>
            {recognition.link && (
              <a
                href={recognition.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <ExternalLink className="w-5 h-5 text-primary hover:text-primary/80" />
              </a>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          <Tabs defaultValue="impressiveness" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur border rounded-lg overflow-hidden">
              <TabsTrigger value="impressiveness" className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none">Impressiveness</TabsTrigger>
              <TabsTrigger value="narrative" className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none">Narrative Fit</TabsTrigger>
              <TabsTrigger value="strategic" className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none">Strategic Value</TabsTrigger>
            </TabsList>

            {/* Impressiveness Tab */}
            <TabsContent value="impressiveness" className="space-y-6">
              {/* Overview */}
              <Card className="border bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Impressiveness Overview
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`${scoreColor} text-4xl font-extrabold`}>{scores.impressiveness.overall.toFixed(1)}</span>
                        <span className="text-muted-foreground font-medium">/10</span>
                      </div>
                      {(() => { const tier = getTierSummary(scores.impressiveness.overall); return (
                        <div className="text-xs text-muted-foreground">{tier.label} • {getPercentileBand(scores.impressiveness.overall)}</div>
                      ); })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Comparative position</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {buildComparativeText()}
                      </p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Estimated percentile</div>
                          <div className="font-medium">{getPercentileBand(scores.impressiveness.overall)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Recognition tier</div>
                          <div className="font-medium">{recognition.tier.charAt(0).toUpperCase() + recognition.tier.slice(1)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Issuer prestige</div>
                          <div className="font-medium">{scores.impressiveness.breakdown.issuerPrestige.toFixed(1)}/10</div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Positioning verdict</h4>
                      {(() => { const v = getPositionVerdict(); return (
                        <p className="text-sm text-foreground/80 leading-relaxed"><span className="font-medium">{v.label}.</span> This is due to {v.rationale}.</p>
                      ); })()}
                      <div className="mt-2 text-sm text-muted-foreground">Upgrade path: {buildUpgradeAdvice()}</div>
                    </div>
                    <div className="border-t" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Implications for the admissions officer</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {buildOfficerImplication()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifics (stacked, single-open accordion) */}
              <Accordion type="single" collapsible defaultValue="selectivity" className="rounded-xl border bg-card divide-y">
                <AccordionItem value="selectivity">
                  <AccordionTrigger className="px-4 data-[state=open]:bg-primary/5">
                    <div className="flex w-full items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Gauge className="h-3.5 w-3.5" /></span>
                      <span className="text-sm font-semibold">Selectivity</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs text-sm">Acceptance rate and competition scale; lower rates and larger pools indicate higher rigor.</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-auto text-xs font-semibold text-foreground/70">{scores.impressiveness.breakdown.selectivity.toFixed(1)}/10</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 text-sm text-foreground/80">
                      <h4 className="text-base font-semibold">Selectivity details</h4>
                      {recognition.selectivity ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Acceptance rate</div>
                              <div className="font-medium">{(recognition.selectivity.acceptanceRate * 100).toFixed(1)}%</div>
                            </div>
                            {(typeof recognition.selectivity.accepted === 'number' && typeof recognition.selectivity.applicants === 'number') && (
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Applicants</div>
                                <div className="font-medium">{recognition.selectivity.accepted.toLocaleString()} / {recognition.selectivity.applicants.toLocaleString()}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Recognition tier</div>
                              <div className="font-medium">{recognition.tier.charAt(0).toUpperCase() + recognition.tier.slice(1)}</div>
                            </div>
                          </div>
                          <div className="text-foreground/70">{recognition.selectivity.description}</div>
                          <div className="border-t my-2" />
                          {(typeof recognition.selectivity.accepted === 'number' && typeof recognition.selectivity.applicants === 'number') && (
                            <></>
                          )}
                          <h5 className="text-sm font-semibold">Why this scored as it did</h5>
                          <div className="text-foreground/80">{buildSelectivityInsight()}</div>
                          <h5 className="text-sm font-semibold mt-2">How this strengthens the profile</h5>
                          <div className="text-foreground/80">Competitive selection communicates readiness to excel under external standards, increasing confidence in projected academic performance.</div>
                        </>
                      ) : (
                        <div>No selectivity data provided for this recognition.</div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="issuer-prestige">
                  <AccordionTrigger className="px-4 data-[state=open]:bg-primary/5">
                    <div className="flex w-full items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Building2 className="h-3.5 w-3.5" /></span>
                      <span className="text-sm font-semibold">Issuer Prestige</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs text-sm">Reputation and credibility of the organization granting the recognition.</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-auto text-xs font-semibold text-foreground/70">{scores.impressiveness.breakdown.issuerPrestige.toFixed(1)}/10</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 text-sm text-foreground/80">
                      <h4 className="text-base font-semibold">Issuer prestige details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Issuing organization</div>
                          <div className="font-medium">{recognition.issuer}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Prestige score</div>
                          <div className="font-medium">{scores.impressiveness.breakdown.issuerPrestige.toFixed(1)}/10</div>
                        </div>
                      </div>
                      <h5 className="text-sm font-semibold">Why this scored as it did</h5>
                      <div className="text-foreground/80">{buildPrestigeInsight()}</div>
                      <h5 className="text-sm font-semibold mt-2">How this strengthens the profile</h5>
                      <div className="text-foreground/80">Prestigious issuers act as third-party validators; this compresses doubt in committee and allows scarce space to focus on outcomes rather than justification.</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="relevance">
                  <AccordionTrigger className="px-4 data-[state=open]:bg-primary/5">
                    <div className="flex w-full items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Info className="h-3.5 w-3.5" /></span>
                      <span className="text-sm font-semibold">Relevance</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs text-sm">Closeness to intended major and narrative; higher means easier connection to the applicant’s academic story.</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-auto text-xs font-semibold text-foreground/70">{scores.narrativeFit.spineAlignment}% aligned</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 text-sm text-foreground/80">
                      <h4 className="text-base font-semibold">Relevance details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Alignment</div>
                          <div className="font-medium">{scores.narrativeFit.spineAlignment}%</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Narrative themes</div>
                          <div className="font-medium">{(scores.narrativeFit.themeSupport || []).slice(0,2).join(', ') || '—'}</div>
                        </div>
                      </div>
                      <h5 className="text-sm font-semibold">Why this scored as it did</h5>
                      <div className="text-foreground/80">{buildRelevanceInsight()}</div>
                      <h5 className="text-sm font-semibold mt-2">How this strengthens the profile</h5>
                      <div className="text-foreground/80">High relevance reduces cognitive load for the admissions officer, making the case for fit and progression more immediate across the application.</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="text-xs text-muted-foreground">Note: Recency is no longer used in the impressiveness score.</div>
            </TabsContent>

            {/* Narrative Fit Tab */}
            <TabsContent value="narrative" className="space-y-0">
              <NarrativeFitWorkshop recognition={recognition} />
            </TabsContent>

            {/* Strategic Value Tab (placeholder) */}
            <TabsContent value="strategic" className="space-y-4">
              <div className="p-6 rounded-xl border bg-muted/20">
                <div className="text-xs font-medium text-muted-foreground mb-1">Coming soon</div>
                <p className="text-sm text-muted-foreground">We’ll break down how this recognition strengthens your overall application strategy.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
