/**
 * Essay Coaching Routes
 *
 * HTTP API for the essay coaching Conversator system.
 * Connects the Essay Intelligence coaching pipeline to the frontend via REST endpoints.
 *
 * Cross-session continuity: persists coaching state + profile cache to
 * essay_understanding table. Resumes sessions across server restarts and TTL expiry.
 * Cross-essay intelligence: builds student digest from all analyzed essays.
 *
 * ROUTES:
 * POST /essay-coaching/start    — Analyze essay + start coaching session
 * POST /essay-coaching/respond  — Process a coaching turn
 * POST /essay-coaching/edit     — Process an essay edit (triggers reanalysis)
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from './middleware/auth';
import { supabaseAdmin } from '@/supabase/admin';
import { assembleStudentContext } from '@/services/studentNarrativeBridge';
import type { StudentModuleOutputs } from '@/services/studentNarrativeBridge';
import type {
  EssayProfile,
  CoachingSessionMemory,
  LearningStyleObservations,
  StudentTheory,
} from '@/services/essayIntelligence/profileTypes';

const essayCoachingRouter = Router();

// ============================================================================
// SESSION STORE (in-memory hot cache — backed by DB persistence)
// ============================================================================

const sessionStore = new Map<string, {
  orchestrator: import('@/services/essayIntelligence/analysis/reanalysisOrchestrator').ReanalysisOrchestrator;
  createdAt: number;
  lastAccessed: number;
  /** College ID for supplement essays (e.g., 'stanford', 'mit') */
  collegeId?: string;
}>();

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function cleanupSessions(): void {
  const now = Date.now();
  for (const [key, session] of sessionStore) {
    if (now - session.lastAccessed > SESSION_TTL_MS) {
      sessionStore.delete(key);
    }
  }
}
setInterval(cleanupSessions, 10 * 60 * 1000);

// ============================================================================
// HELPERS
// ============================================================================

async function resolveProfileId(clerkUserId: string): Promise<string | null> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', clerkUserId)
    .single();
  if (error || !profile) return null;
  return profile.id;
}

function getAuthUserId(req: Request, res: Response): string | null {
  const userId = (req as any).auth?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return null;
  }
  return userId;
}

async function assembleCrossModuleContext(profileId: string): Promise<string> {
  const outputs: StudentModuleOutputs = {};
  try {
    // Load activity profiles with rich JSONB story data
    const { data: activityProfiles } = await supabaseAdmin
      .from('activity_profiles')
      .select('activity_id, title, tier, key_strengths, key_moment, authentic_quote, profile_data')
      .eq('profile_id', profileId)
      .limit(10);
    if (activityProfiles && activityProfiles.length > 0) {
      outputs.activityProfiles = activityProfiles.map(ap => {
        const pd = ap.profile_data as Record<string, any> | null;
        const story = pd?.story as Record<string, any> | undefined;
        const meaning = pd?.meaning as Record<string, any> | undefined;
        let originStory: string | undefined;
        if (story?.origin) {
          const o = story.origin as Record<string, string>;
          originStory = o.howStarted
            ? (o.catalyst ? `${o.howStarted} (catalyst: ${o.catalyst})` : o.howStarted)
            : undefined;
        }
        return {
          title: ap.title ?? 'Untitled',
          tier: ap.tier ?? 3,
          keyStrengths: Array.isArray(ap.key_strengths) ? ap.key_strengths as string[] : [],
          keyMoment: ap.key_moment ?? undefined,
          authenticQuote: ap.authentic_quote ?? undefined,
          originStory,
          proudestMoment: typeof meaning?.proudestMoment === 'string' ? meaning.proudestMoment : undefined,
          whyItMatters: typeof meaning?.whyItMatters === 'string' ? meaning.whyItMatters : undefined,
        };
      });
      // Derive lightweight portfolio synthesis from activity data
      const strongActivities = outputs.activityProfiles.filter(a => a.tier <= 2);
      if (outputs.activityProfiles.length >= 2) {
        const topActivity = outputs.activityProfiles.slice().sort((a, b) => a.tier - b.tier)[0];
        outputs.portfolioSynthesis = {
          spike: topActivity && topActivity.tier <= 2 ? `${topActivity.title} (Tier ${topActivity.tier})` : undefined,
          strongActivityCount: strongActivities.length,
        };
      }
    }
    const { data: academic } = await supabaseAdmin
      .from('academic_profiles')
      .select('gpa_context, course_load_summary, major_direction')
      .eq('profile_id', profileId)
      .single();
    if (academic) {
      outputs.academicContext = {
        gpaContext: academic.gpa_context ?? undefined,
        courseLoadSummary: academic.course_load_summary ?? undefined,
        majorDirection: academic.major_direction ?? undefined,
      };
    }
  } catch (err) {
    console.warn('[essay-coaching] Cross-module context assembly failed (non-fatal):', err);
  }
  return assembleStudentContext(outputs);
}

// ============================================================================
// COACHING STATE PERSISTENCE
// ============================================================================

interface PersistedCoachingState {
  sessionMemory: CoachingSessionMemory;
  learningStyle: LearningStyleObservations;
  lastTurnAt: string;
}

function saveCoachingState(essayId: string, userId: string, state: PersistedCoachingState): void {
  supabaseAdmin
    .from('essay_understanding')
    .update({ coaching_state: state as unknown as Record<string, unknown> })
    .eq('essay_id', essayId)
    .eq('user_id', userId)
    .then(({ error }) => {
      if (error) console.warn('[essay-coaching] Coaching state save failed:', error.message);
    })
    .catch((err: unknown) => {
      console.warn('[essay-coaching] Coaching state save error:', err);
    });
}

async function loadCoachingState(essayId: string, userId: string): Promise<PersistedCoachingState | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essay_understanding')
      .select('coaching_state')
      .eq('essay_id', essayId)
      .eq('user_id', userId)
      .single();
    if (error || !data?.coaching_state) return null;
    return data.coaching_state as unknown as PersistedCoachingState;
  } catch { return null; }
}

// ============================================================================
// CROSS-ESSAY STUDENT DIGEST + PORTFOLIO ALERTING
// ============================================================================

interface EssayDigestSlice {
  essayId: string;
  essayType: string;
  writerPortrait: string | null;
  archetype: string | null;
  themes: string[];
  revealedQualities: string[];
  phase: string | null;
}

async function buildStudentDigest(userId: string, currentEssayId: string): Promise<{ essays: EssayDigestSlice[]; portfolioAlert: string | null } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essay_understanding')
      .select('essay_id, essay_type, profile_cache')
      .eq('user_id', userId)
      .not('profile_cache', 'is', null);
    if (error || !data || data.length === 0) return null;

    const essays: EssayDigestSlice[] = [];
    for (const row of data) {
      const pc = row.profile_cache as Record<string, any> | null;
      if (!pc) continue;
      const cr = pc.characterRevelation as Record<string, any> | null;
      const ap = pc.admissionsPositioning as Record<string, any> | null;
      const ta = pc.thematicArchitecture as Record<string, any> | null;
      const idx = pc.index as Record<string, any> | null;
      essays.push({
        essayId: row.essay_id,
        essayType: row.essay_type ?? 'unknown',
        writerPortrait: cr?.writerPortrait ?? null,
        archetype: ap?.archetypeContext?.archetype ?? null,
        themes: (ta?.threads as Array<{ thread: string }> | null)?.map(t => t.thread)?.slice(0, 5) ?? [],
        revealedQualities: (cr?.revealedQualities as string[] | null)?.slice(0, 5) ?? [],
        phase: (idx?.improvementPhase as Record<string, any>)?.level ?? null,
      });
    }
    if (essays.length <= 1) return { essays, portfolioAlert: null };

    const otherEssays = essays.filter(e => e.essayId !== currentEssayId);
    const currentEssay = essays.find(e => e.essayId === currentEssayId);
    const alerts: string[] = [];

    if (currentEssay?.archetype) {
      const same = otherEssays.filter(e => e.archetype === currentEssay.archetype);
      if (same.length > 0) {
        alerts.push(`ARCHETYPE OVERLAP: This essay uses "${currentEssay.archetype}". The student's ${same.map(e => e.essayType).join(', ')} essay(s) use the SAME archetype. Advise differentiation.`);
      }
    }
    if (currentEssay?.themes) {
      for (const theme of currentEssay.themes) {
        const word = theme.toLowerCase().split(' ')[0];
        const overlap = otherEssays.filter(e => e.themes.some(t => t.toLowerCase().includes(word)));
        if (overlap.length > 0) {
          alerts.push(`THEME OVERLAP: "${theme}" also in ${overlap.map(e => e.essayType).join(', ')} essay(s).`);
        }
      }
    }
    return { essays, portfolioAlert: alerts.length > 0 ? alerts.join('\n') : null };
  } catch (err) {
    console.warn('[essay-coaching] Student digest failed:', err);
    return null;
  }
}

function formatStudentDigest(digest: { essays: EssayDigestSlice[]; portfolioAlert: string | null }, currentEssayId: string): string {
  const others = digest.essays.filter(e => e.essayId !== currentEssayId);
  if (others.length === 0) return '';
  const lines: string[] = ['=== STUDENT PORTFOLIO CONTEXT ==='];
  for (const e of others) {
    const p: string[] = [e.essayType.toUpperCase()];
    if (e.archetype) p.push(`archetype: "${e.archetype}"`);
    if (e.writerPortrait) p.push(`portrait: ${e.writerPortrait.slice(0, 150)}`);
    if (e.themes.length > 0) p.push(`themes: ${e.themes.join(', ')}`);
    if (e.revealedQualities.length > 0) p.push(`qualities: ${e.revealedQualities.join(', ')}`);
    lines.push(`- ${p.join(' | ')}`);
  }
  if (digest.portfolioAlert) { lines.push(''); lines.push(digest.portfolioAlert); }
  lines.push('===');
  return lines.join('\n');
}

// ============================================================================
// CROSS-SESSION THEORY BRIDGE
// ============================================================================

function mergeTheories(theories: Array<{ theory: StudentTheory; lastTurnAt: string }>): StudentTheory | null {
  if (theories.length === 0) return null;
  const sorted = [...theories].sort((a, b) => new Date(b.lastTurnAt).getTime() - new Date(a.lastTurnAt).getTime());
  const dedup = <T extends Record<string, any>>(items: T[], field: string): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = String(item[field] ?? '').toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  return {
    personhood: sorted[0].theory.personhood,
    essayRelationship: sorted[0].theory.essayRelationship,
    protectedValues: dedup(sorted.flatMap(s => s.theory.protectedValues ?? []), 'value'),
    blindSpotHypotheses: dedup(sorted.flatMap(s => s.theory.blindSpotHypotheses ?? []), 'hypothesis'),
    tensions: dedup(sorted.flatMap(s => s.theory.tensions ?? []), 'studentSays'),
    crossLayerPatterns: dedup(sorted.flatMap(s => s.theory.crossLayerPatterns ?? []), 'analysisObservation'),
    synthesizedAtTurn: 0,
    pendingObservations: [],
  };
}

async function loadCrossSessionTheory(userId: string): Promise<StudentTheory | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essay_understanding')
      .select('coaching_state')
      .eq('user_id', userId)
      .not('coaching_state', 'is', null);
    if (error || !data || data.length === 0) return null;
    const theories: Array<{ theory: StudentTheory; lastTurnAt: string }> = [];
    for (const row of data) {
      const state = row.coaching_state as unknown as PersistedCoachingState | null;
      if (!state?.sessionMemory?.studentTheory) continue;
      theories.push({ theory: state.sessionMemory.studentTheory, lastTurnAt: state.lastTurnAt ?? new Date(0).toISOString() });
    }
    return mergeTheories(theories);
  } catch { return null; }
}

async function loadCrossSessionLearningStyle(userId: string): Promise<LearningStyleObservations | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essay_understanding')
      .select('coaching_state')
      .eq('user_id', userId)
      .not('coaching_state', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    const state = data[0].coaching_state as unknown as PersistedCoachingState | null;
    if (!state?.learningStyle?.observations?.length) return null;
    return { observations: state.learningStyle.observations.filter(o => o.confidence === 'confident' || o.confidence === 'growing') };
  } catch { return null; }
}

// ============================================================================
// POST /essay-coaching/start
// ============================================================================
essayCoachingRouter.post('/essay-coaching/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;
    const { essayId, essayText, essayType = 'common_app', collegeId } = req.body;
    if (!essayId || !essayText) return res.status(400).json({ success: false, error: 'essayId and essayText are required' });
    const normalizedCollegeId = typeof collegeId === 'string' ? collegeId.toLowerCase() : undefined;

    const profileId = await resolveProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'User profile not found' });

    const { ReanalysisOrchestrator } = await import('@/services/essayIntelligence/analysis/reanalysisOrchestrator');
    const { SupabaseCheckpointStore, hashEssayText } = await import('@/services/essayIntelligence/profileManager/supabaseCheckpointStore');

    const checkpointStore = new SupabaseCheckpointStore(userId);
    const textHash = hashEssayText(essayText);
    let profile: EssayProfile | null = null;
    let pipelineCost = 0;
    let pipelinePhase = 'unknown';
    let cacheHit = false;

    const cachedProfile = await checkpointStore.loadIfHashMatches(essayId, textHash);
    if (cachedProfile) {
      console.log(`[essay-coaching/start] Cache HIT for essay ${essayId}`);
      profile = cachedProfile;
      pipelinePhase = (profile.index as any)?.improvementPhase?.level ?? 'unknown';
      cacheHit = true;
    } else {
      console.log(`[essay-coaching/start] Cache MISS — analyzing essay ${essayId} (${essayText.length} chars)`);
      const { analysisOrchestrator } = await import('@/services/essayIntelligence/analysis/analysisOrchestrator');
      const result = await analysisOrchestrator.analyzeEssay({
        essayId, essayText, essayType: essayType as 'common_app' | 'supplement' | 'piq',
        includeAnnotations: false, checkpointStore,
      });
      profile = result.profile as EssayProfile;
      pipelineCost = result.costSummary.totalCost;
      pipelinePhase = result.improvementPhase?.level ?? 'unknown';
    }

    const orchestrator = new ReanalysisOrchestrator(profile, checkpointStore, essayId);
    const sessionKey = `${profileId}:${essayId}`;
    sessionStore.set(sessionKey, { orchestrator, createdAt: Date.now(), lastAccessed: Date.now(), collegeId: normalizedCollegeId });

    // Load previous coaching state + cross-session intelligence
    const previousState = await loadCoachingState(essayId, userId);
    const crossTheory = await loadCrossSessionTheory(userId);
    const crossStyle = await loadCrossSessionLearningStyle(userId);

    let initialMemory: CoachingSessionMemory | undefined;
    let initialStyle: LearningStyleObservations | undefined;

    if (previousState && cacheHit) {
      console.log('[essay-coaching/start] Resuming previous coaching session');
      initialMemory = previousState.sessionMemory;
      initialStyle = previousState.learningStyle;
    } else if (crossTheory) {
      console.log('[essay-coaching/start] Seeding cross-session theory');
      initialMemory = {
        turnCount: 0, topicsDiscussed: [], approachesUsed: [], studentStances: [],
        events: [], sessionArcSummary: '', nextFocus: '', strategicQuestion: '',
        questionStaleness: 0, studentTheory: crossTheory,
      } as CoachingSessionMemory;
      initialStyle = crossStyle ?? undefined;
    }

    // Cross-essay digest + portfolio alert
    const digest = await buildStudentDigest(userId, essayId);
    const digestCtx = digest ? formatStudentDigest(digest, essayId) : '';
    const baseCtx = await assembleCrossModuleContext(profileId);
    const fullCtx = [baseCtx, digestCtx].filter(Boolean).join('\n\n') || undefined;

    const coachingResult = await orchestrator.processCoachingTurn(
      'What do you think of my essay?', [], undefined, initialMemory, initialStyle, fullCtx, normalizedCollegeId,
    );

    if (coachingResult.sessionMemory) {
      saveCoachingState(essayId, userId, {
        sessionMemory: coachingResult.sessionMemory,
        learningStyle: coachingResult.learningStyle ?? { observations: [] },
        lastTurnAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: {
        sessionKey, pipelinePhase, pipelineCost, cacheHit,
        coachingResponse: coachingResult.response,
        coachingCost: coachingResult.totalCost,
        sessionMemory: coachingResult.sessionMemory,
        learningStyle: coachingResult.learningStyle,
        hasCrossModuleContext: !!fullCtx,
        hasCrossSessionTheory: !!crossTheory,
        hasPortfolioContext: !!(digest && digest.essays.length > 1),
      },
    });
  } catch (error: unknown) {
    console.error('[essay-coaching/start] Error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to start coaching session' });
  }
});

// ============================================================================
// POST /essay-coaching/respond
// ============================================================================
essayCoachingRouter.post('/essay-coaching/respond', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;
    const { essayId, studentMessage, conversationHistory = [], sessionMemory, learningStyle } = req.body;
    if (!essayId || !studentMessage) return res.status(400).json({ success: false, error: 'essayId and studentMessage are required' });

    const profileId = await resolveProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'User profile not found' });

    const sessionKey = `${profileId}:${essayId}`;
    const session = sessionStore.get(sessionKey);
    if (!session) return res.status(404).json({ success: false, error: 'No active coaching session. Call /essay-coaching/start first.' });
    session.lastAccessed = Date.now();

    const crossModuleContext = await assembleCrossModuleContext(profileId);
    const result = await session.orchestrator.processCoachingTurn(
      studentMessage, conversationHistory, undefined, sessionMemory, learningStyle, crossModuleContext || undefined, session.collegeId,
    );

    if (result.sessionMemory) {
      saveCoachingState(essayId, userId, {
        sessionMemory: result.sessionMemory,
        learningStyle: result.learningStyle ?? { observations: [] },
        lastTurnAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: {
        response: result.response, cost: result.totalCost, profileDeepened: result.profileDeepened,
        sessionMemory: result.sessionMemory, learningStyle: result.learningStyle,
        cognitiveAssessment: result.cognitiveAssessment,
      },
    });
  } catch (error: unknown) {
    console.error('[essay-coaching/respond] Error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to process coaching turn' });
  }
});

// ============================================================================
// POST /essay-coaching/edit
// ============================================================================
essayCoachingRouter.post('/essay-coaching/edit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;
    const { essayId, oldText, newText } = req.body;
    if (!essayId || !oldText || !newText) return res.status(400).json({ success: false, error: 'essayId, oldText, and newText are required' });

    const profileId = await resolveProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'User profile not found' });

    const sessionKey = `${profileId}:${essayId}`;
    const session = sessionStore.get(sessionKey);
    if (!session) return res.status(404).json({ success: false, error: 'No active coaching session. Call /essay-coaching/start first.' });
    session.lastAccessed = Date.now();

    const editResult = await session.orchestrator.processEdit(oldText, newText);

    return res.json({
      success: true,
      data: { mode: editResult.mode, reanalysisTriggered: editResult.reanalysisTriggered, totalCost: editResult.totalCost },
    });
  } catch (error: unknown) {
    console.error('[essay-coaching/edit] Error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to process edit' });
  }
});

export default essayCoachingRouter;
