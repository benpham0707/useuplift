/**
 * Enhanced Workshop Routes
 *
 * New Express Router module providing session-aware, voice-profiled
 * inline editing, authenticity checking, and analytics capabilities.
 *
 * Mounted at /enhanced/* — completely separate from existing workshop routes.
 * Circuit breaker protected: 5 consecutive 500s in 60s -> auto-disable for 5min.
 * Kill switch: ENABLE_ENHANCED_WORKSHOP=false -> force-disable.
 *
 * All routes require authentication via Clerk JWT (requireAuth middleware).
 * All routes return { success: boolean, data?: T, error?: string }.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from './middleware/auth';
import { enhancedWorkshopConfig } from '@/services/enhancedWorkshop/config';
import type {
  StartEnhancedSessionInput,
  EnhancedInlineEditRequest,
  SuggestCommandsRequest,
  BuildVoiceProfileRequest,
  AuthenticityCheckRequest,
  VersionCompareRequest,
  EnhanceRequest,
  PreAnalyzeRequest,
  PlanImprovementsRequest,
  RegressionCheckRequest,
} from '@/services/enhancedWorkshop/types';

const enhancedWorkshopRouter = Router();

// ============================================================================
// CIRCUIT BREAKER MIDDLEWARE — gates all routes
// ============================================================================
enhancedWorkshopRouter.use((_req: Request, res: Response, next) => {
  if (!enhancedWorkshopConfig.isEnabled()) {
    return res.status(503).json({
      success: false,
      error: 'Enhanced workshop temporarily disabled (circuit breaker tripped). Retry in a few minutes.',
    });
  }
  next();
});

// ============================================================================
// POST /session/start — Start an enhanced editing session
// ============================================================================
enhancedWorkshopRouter.post('/session/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: StartEnhancedSessionInput = req.body;

    if (!input.documentType || !input.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentType, text',
      });
    }

    // Lazy imports to avoid circular dependencies
    const { sessionContextService } = await import('@/services/sessionContext');
    const { voiceProfileService } = await import('@/services/voiceProfile');
    const { aiRiskScorer } = await import('@/services/authenticity');

    // Start session
    const session = sessionContextService.startSession({
      userId,
      documentType: input.documentType,
      text: input.text,
      essayType: input.essayType,
      promptText: input.promptText,
      collegeId: input.collegeId,
    });

    // Load existing voice profile (non-blocking failure)
    let voiceProfile = null;
    try {
      voiceProfile = await voiceProfileService.load(userId);
    } catch (error) {
      console.warn('[enhanced/session/start] Failed to load voice profile:', error instanceof Error ? error.message : error);
    }

    // Attach voice profile to session if available
    if (voiceProfile) {
      session.voiceProfile = voiceProfile;
    }

    // Run authenticity check on initial text
    const aiRisk = aiRiskScorer.assessRisk(input.text);

    const wordCount = input.text.split(/\s+/).filter(Boolean).length;

    return res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        voiceProfile,
        aiRisk,
        documentType: input.documentType,
        essayType: input.essayType,
        wordCount,
      },
    });
  } catch (error) {
    console.error('[enhanced/session/start] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start session',
    });
  }
});

// ============================================================================
// POST /session/end — End an editing session, persist analytics
// ============================================================================
enhancedWorkshopRouter.post('/session/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Missing required field: sessionId' });
    }

    const { sessionContextService } = await import('@/services/sessionContext');

    const session = await sessionContextService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Verify session belongs to this user
    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const editCount = session.editHistory.length;
    const acceptedEdits = session.editHistory.filter(e => e.accepted).length;

    // End session (frees memory)
    sessionContextService.endSession(sessionId);

    return res.json({
      success: true,
      data: {
        sessionId,
        editCount,
        acceptedEdits,
        ended: true,
      },
    });
  } catch (error) {
    console.error('[enhanced/session/end] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to end session',
    });
  }
});

// ============================================================================
// POST /inline-edit — Apply an editing command to selected text
// ============================================================================
enhancedWorkshopRouter.post('/inline-edit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: EnhancedInlineEditRequest = req.body;

    if (!input.selectedText || !input.fullDocument || !input.command) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: selectedText, fullDocument, command',
      });
    }

    if (typeof input.selectionStart !== 'number' || typeof input.selectionEnd !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: selectionStart, selectionEnd (must be numbers)',
      });
    }

    const { inlineEditorService } = await import('@/services/inlineEditor');
    const { sessionContextService } = await import('@/services/sessionContext');
    const { voiceProfileService } = await import('@/services/voiceProfile');

    // Load voice profile for voice-aware editing
    let voiceProfile = undefined;
    try {
      voiceProfile = await voiceProfileService.load(userId) ?? undefined;
    } catch (error) {
      console.warn('[enhanced/inline-edit] Failed to load voice profile:', error instanceof Error ? error.message : error);
    }

    // Get session's essay type if available (with ownership check)
    let essayType = undefined;
    if (input.sessionId) {
      const session = await sessionContextService.getSession(input.sessionId);
      if (session && session.userId === userId) {
        essayType = session.essayType;
      }
    }

    const result = await inlineEditorService.applyCommand({
      selectedText: input.selectedText,
      fullDocument: input.fullDocument,
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
      command: input.command,
      voiceProfile,
      essayType,
      additionalContext: input.additionalContext,
      sessionId: input.sessionId,
    });

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: result });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/inline-edit] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Inline edit failed',
    });
  }
});

// ============================================================================
// POST /suggest-commands — Get 2-3 best commands for a text selection
// ============================================================================
enhancedWorkshopRouter.post('/suggest-commands', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: SuggestCommandsRequest = req.body;

    if (!input.selectedText || !input.fullDocument) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: selectedText, fullDocument',
      });
    }

    const { inlineEditorService } = await import('@/services/inlineEditor');

    const suggestions = await inlineEditorService.suggestCommands(
      input.selectedText,
      input.fullDocument,
      input.essayType
    );

    return res.json({ success: true, data: suggestions });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/suggest-commands] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Suggest commands failed',
    });
  }
});

// ============================================================================
// POST /voice-profile — Build or enrich a voice profile
// ============================================================================
enhancedWorkshopRouter.post('/voice-profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: BuildVoiceProfileRequest = req.body;

    if (!input.text || !input.source) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, source',
      });
    }

    const validSources = ['essay', 'chat', 'uploaded_sample'] as const;
    if (!validSources.includes(input.source as typeof validSources[number])) {
      return res.status(400).json({
        success: false,
        error: `Invalid source. Must be one of: ${validSources.join(', ')}`,
      });
    }

    const { voiceProfileService } = await import('@/services/voiceProfile');

    // Enrich if profile exists, otherwise build new
    const existing = await voiceProfileService.load(userId);
    const profile = existing
      ? await voiceProfileService.enrichProfile(userId, input.text, input.source)
      : await voiceProfileService.buildFromSample(userId, input.text, input.source);

    // Persist
    await voiceProfileService.save(profile);

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: profile });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/voice-profile] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Voice profile operation failed',
    });
  }
});

// ============================================================================
// POST /authenticity/check — Run AI risk scorer on text
// ============================================================================
enhancedWorkshopRouter.post('/authenticity/check', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: AuthenticityCheckRequest = req.body;

    if (!input.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { aiRiskScorer } = await import('@/services/authenticity');

    const assessment = aiRiskScorer.assessRisk(input.text);

    return res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('[enhanced/authenticity/check] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authenticity check failed',
    });
  }
});

// ============================================================================
// POST /version-compare — Compare two scored versions
// ============================================================================
enhancedWorkshopRouter.post('/version-compare', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: VersionCompareRequest = req.body;

    if (!input.oldVersion || !input.newVersion) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: oldVersion, newVersion',
      });
    }

    const { versionComparisonService } = await import('@/services/analytics');

    const comparison = versionComparisonService.compareVersions(
      input.oldVersion,
      input.newVersion,
      input.edits
    );
    const summary = versionComparisonService.summarize(comparison);

    return res.json({
      success: true,
      data: { ...comparison, summary },
    });
  } catch (error) {
    console.error('[enhanced/version-compare] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Version comparison failed',
    });
  }
});

// ============================================================================
// POST /pre-analyze — Quick quality snapshot (no LLM)
// ============================================================================
enhancedWorkshopRouter.post('/pre-analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: PreAnalyzeRequest = req.body;

    if (!input.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { preAnalyze } = await import('@/services/enhancedWorkshop/preAnalyzer');

    const snapshot = await preAnalyze(input.text, input.essayType, input.useNewScoringPipeline ?? true);

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/pre-analyze] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Pre-analysis failed',
    });
  }
});

// ============================================================================
// POST /plan-improvements — LLM-powered improvement plan (Haiku ~$0.002)
// ============================================================================
enhancedWorkshopRouter.post('/plan-improvements', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: PlanImprovementsRequest = req.body;

    if (!input.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { preAnalyze } = await import('@/services/enhancedWorkshop/preAnalyzer');
    const { planImprovements } = await import('@/services/enhancedWorkshop/improvementPlanner');

    const snapshot = await preAnalyze(input.text, input.essayType, input.useNewScoringPipeline ?? true);
    const plan = await planImprovements(snapshot, {
      focusDimensions: input.focusDimensions,
      maxActions: input.maxActions,
      essayType: input.essayType,
      useNewScoringPipeline: input.useNewScoringPipeline ?? true,
    });

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: plan });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/plan-improvements] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Planning failed',
    });
  }
});

// ============================================================================
// POST /regression-check — Compare before/after text quality (hybrid: heuristic + LLM)
// ============================================================================
enhancedWorkshopRouter.post('/regression-check', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: RegressionCheckRequest = req.body;

    if (!input.beforeText || !input.afterText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: beforeText, afterText',
      });
    }

    const { checkRegressionStandalone } = await import('@/services/enhancedWorkshop/regressionGuard');

    const result = await checkRegressionStandalone(input.beforeText, input.afterText, input.essayType);

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: result });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/regression-check] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Regression check failed',
    });
  }
});

// ============================================================================
// POST /enhance — Full enhancement loop (pre-analyze → plan → edit → guard)
// ============================================================================
enhancedWorkshopRouter.post('/enhance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: EnhanceRequest = req.body;

    if (!input.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { writingEnhancementOrchestrator } = await import(
      '@/services/enhancedWorkshop/writingEnhancementOrchestrator'
    );

    const result = await writingEnhancementOrchestrator.enhance({
      ...input,
      useNewScoringPipeline: input.useNewScoringPipeline ?? true,
    });

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: result });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/enhance] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed',
    });
  }
});

// ============================================================================
// POST /enhance/stream — SSE streaming enhancement loop
// ============================================================================
enhancedWorkshopRouter.post('/enhance/stream', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const input: EnhanceRequest = req.body;

    if (!input.text) {
      return res.status(400).json({ success: false, error: 'Missing required field: text' });
    }

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Track client disconnect to stop wasting LLM credits
    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    const { writingEnhancementOrchestrator } = await import(
      '@/services/enhancedWorkshop/writingEnhancementOrchestrator'
    );

    await writingEnhancementOrchestrator.enhanceStreaming(
      { ...input, useNewScoringPipeline: input.useNewScoringPipeline ?? true },
      (event) => {
        if (!clientDisconnected && !res.destroyed) {
          try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* socket closed */ }
        }
      }
    );

    // Final close
    if (!clientDisconnected && !res.destroyed) {
      try {
        res.write(`data: [DONE]\n\n`);
        res.end();
      } catch { /* socket closed */ }
    }

    enhancedWorkshopConfig.recordSuccess();
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/enhance/stream] Error:', error);
    // If headers already sent, send error event
    if (res.headersSent) {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Enhancement failed' },
          timestamp: new Date().toISOString(),
        })}\n\n`);
        res.end();
      } catch { /* socket already closed */ }
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Enhancement failed',
      });
    }
  }
});

// ============================================================================
// POST /apply-improvement — Apply a single improvement action with guard
// ============================================================================
enhancedWorkshopRouter.post('/apply-improvement', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { text, essayType, action, sessionId } = req.body;

    if (!text || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, action',
      });
    }

    const { writingEnhancementOrchestrator } = await import(
      '@/services/enhancedWorkshop/writingEnhancementOrchestrator'
    );

    // Run the full enhance flow but with a single action
    const result = await writingEnhancementOrchestrator.enhance({
      text,
      essayType,
      maxSteps: 1,
      sessionId,
      focusDimensions: [action.dimension],
      useNewScoringPipeline: req.body.useNewScoringPipeline ?? true,
    });

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: result });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/apply-improvement] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Improvement application failed',
    });
  }
});

// ============================================================================
// POST /portfolio-analyze — Cross-essay portfolio intelligence
// ============================================================================
enhancedWorkshopRouter.post('/portfolio-analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { essays, targetTier, collegeId } = req.body;

    if (!essays || !Array.isArray(essays) || essays.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: essays (must be a non-empty array)',
      });
    }

    const { portfolioIntelligenceService } = await import(
      '@/services/portfolioIntelligence'
    );

    const analysis = await portfolioIntelligenceService.analyzePortfolio({
      essays,
      targetTier,
      collegeId,
    });

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: analysis });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/portfolio-analyze] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Portfolio analysis failed',
    });
  }
});

// ============================================================================
// POST /voice-drift — Check voice drift against baseline profile
// ============================================================================
enhancedWorkshopRouter.post('/voice-drift', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { voiceProfileService, styleConsistencyService } = await import(
      '@/services/voiceProfile'
    );

    // Load voice profile for this user
    const profile = await voiceProfileService.load(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No voice profile found. Build one first via /enhanced/voice-profile.',
      });
    }

    const driftAnalysis = styleConsistencyService.compareToBaseline(text, profile);

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: driftAnalysis });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/voice-drift] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Voice drift analysis failed',
    });
  }
});

// ============================================================================
// POST /competitive-analysis — Detect overused phrases and AO fatigue patterns
// ============================================================================
enhancedWorkshopRouter.post('/competitive-analysis', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { text, essayType } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { competitiveIntelligenceService } = await import(
      '@/services/competitiveIntelligence'
    );

    const analysis = competitiveIntelligenceService.analyze({ text, essayType });

    enhancedWorkshopConfig.recordSuccess();
    return res.json({ success: true, data: analysis });
  } catch (error) {
    enhancedWorkshopConfig.recordFailure();
    console.error('[enhanced/competitive-analysis] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Competitive analysis failed',
    });
  }
});

export default enhancedWorkshopRouter;
