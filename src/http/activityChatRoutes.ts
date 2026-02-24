/**
 * Activity Chat Routes
 *
 * HTTP API for the conversational activity profiling system.
 * Enables students to have natural dialogue about their activities,
 * building rich profiles that power better descriptions and scores.
 *
 * All routes require authentication via Clerk JWT.
 * Profile ID is resolved from Clerk userId via the profiles table.
 *
 * ROUTES:
 * POST /activity-chat/start          - Start a new conversation
 * POST /activity-chat/respond        - Process a user response
 * POST /activity-chat/end            - End a conversation early
 * POST /activity-chat/resume         - Resume a paused conversation
 * GET  /activity-chat/summary/:id    - Get conversation summary
 * GET  /activity-chat/profile/:id    - Get activity profile
 * GET  /activity-chat/profiles       - Get all activity profiles for user
 * POST /activity-chat/assess-need    - Check which activities need chat
 * POST /activity-chat/generate-description - Generate descriptions from profile
 * GET  /activity-chat/conversations  - List conversations (optional ?activityId filter)
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from './middleware/auth';

const activityChatRouter = Router();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve Clerk userId to Supabase profile_id.
 * Returns the profile UUID or null if not found.
 */
async function resolveProfileId(clerkUserId: string): Promise<string | null> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', clerkUserId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile.id;
}

/**
 * Extract and validate the Clerk userId from the request.
 * Returns the userId or sends a 401 response and returns null.
 */
function getAuthUserId(req: Request, res: Response): string | null {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return null;
  }
  return userId;
}

// ============================================================================
// POST /activity-chat/start
// Start a new conversation about an activity
// ============================================================================
activityChatRouter.post('/activity-chat/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { activityProfileChatService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { activityId, activityTitle, trigger, studentContext, basicData } = req.body;

    if (!activityId || !activityTitle) {
      return res.status(400).json({
        success: false,
        error: 'activityId and activityTitle are required',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Load existing profile if any
    const existingProfileResult = await chatPersistenceService.loadProfile(profileId, activityId);

    const result = await activityProfileChatService.startConversation({
      activityId,
      activityTitle,
      trigger: trigger || 'user_initiated',
      existingProfile: existingProfileResult.success ? existingProfileResult.profile : undefined,
      studentContext,
      basicData,
    });

    if (!result.success || !result.state) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to start conversation',
      });
    }

    // Save conversation state
    await chatPersistenceService.saveConversation(
      profileId,
      result.state.conversationId,
      activityId,
      result.state
    );

    return res.json({
      success: true,
      data: {
        conversationId: result.state.conversationId,
        openingMessage: result.openingMessage,
        firstQuestion: result.firstQuestion,
        phase: result.state.phase,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/start] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start conversation',
    });
  }
});

// ============================================================================
// POST /activity-chat/respond
// Process a user response in an ongoing conversation
// ============================================================================
activityChatRouter.post('/activity-chat/respond', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { activityProfileChatService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { conversationId, response, metadata } = req.body;

    if (!conversationId || !response) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and response are required',
      });
    }

    if (typeof response !== 'string' || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'response must be a non-empty string',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Load conversation state from DB (scoped to authenticated user)
    const stateResult = await chatPersistenceService.loadConversation(conversationId, profileId);
    if (!stateResult.success || !stateResult.state) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied',
      });
    }

    // Process the response
    const result = await activityProfileChatService.processUserResponse({
      state: stateResult.state,
      response: response.trim(),
      metadata,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to process response',
      });
    }

    // Save updated state
    if (result.state) {
      await chatPersistenceService.saveConversation(
        profileId,
        conversationId,
        result.state.activityId,
        result.state
      );

      // If conversation ended, save the final profile
      if (result.shouldEnd && result.state.currentProfile) {
        await chatPersistenceService.saveProfile(
          profileId,
          result.state.activityId,
          result.state.activityTitle,
          result.state.currentProfile
        );
      }
    }

    // Return only what the frontend needs
    return res.json({
      success: true,
      data: {
        nextQuestion: result.nextQuestion,
        shouldEnd: result.shouldEnd,
        endReason: result.endReason,
        closingMessage: result.closingMessage,
        extraction: result.extraction ? {
          extractionQuality: result.extraction.extractionQuality,
          extractedFieldCount: result.extraction.extractedFields.length,
          authenticQuotesCount: result.extraction.authenticQuotes.length,
        } : undefined,
        phase: result.state?.phase,
        totalTurns: result.state?.totalTurns,
        tokensUsed: result.tokensUsed,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/respond] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process response',
    });
  }
});

// ============================================================================
// POST /activity-chat/end
// End a conversation early
// ============================================================================
activityChatRouter.post('/activity-chat/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { activityProfileChatService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Load conversation state (scoped to authenticated user)
    const stateResult = await chatPersistenceService.loadConversation(conversationId, profileId);
    if (!stateResult.success || !stateResult.state) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied',
      });
    }

    // End the conversation
    const result = activityProfileChatService.endConversation(stateResult.state);

    // Save final profile
    await chatPersistenceService.saveProfile(
      profileId,
      stateResult.state.activityId,
      stateResult.state.activityTitle,
      result.finalProfile
    );

    // Mark conversation as complete
    const completedState = {
      ...stateResult.state,
      phase: 'complete' as const,
      currentProfile: result.finalProfile,
    };
    await chatPersistenceService.saveConversation(
      profileId,
      conversationId,
      stateResult.state.activityId,
      completedState
    );

    return res.json({
      success: true,
      data: {
        closingMessage: result.closingMessage,
        summary: result.summary,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/end] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to end conversation',
    });
  }
});

// ============================================================================
// POST /activity-chat/resume
// Resume a paused conversation
// ============================================================================
activityChatRouter.post('/activity-chat/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { activityProfileChatService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Load conversation state (scoped to authenticated user)
    const stateResult = await chatPersistenceService.loadConversation(conversationId, profileId);
    if (!stateResult.success || !stateResult.state) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied',
      });
    }

    if (stateResult.state.phase === 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Conversation is already complete and cannot be resumed',
      });
    }

    // Resume the conversation
    const result = activityProfileChatService.resumeConversation(stateResult.state);

    // Save updated state
    await chatPersistenceService.saveConversation(
      profileId,
      conversationId,
      result.state.activityId,
      result.state
    );

    return res.json({
      success: true,
      data: {
        welcomeBackMessage: result.welcomeBackMessage,
        nextQuestion: result.nextQuestion,
        phase: result.state.phase,
        totalTurns: result.state.totalTurns,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/resume] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume conversation',
    });
  }
});

// ============================================================================
// GET /activity-chat/summary/:conversationId
// Get conversation summary
// ============================================================================
activityChatRouter.get('/activity-chat/summary/:conversationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { activityProfileChatService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId parameter is required',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Load conversation state (scoped to authenticated user)
    const stateResult = await chatPersistenceService.loadConversation(conversationId, profileId);
    if (!stateResult.success || !stateResult.state) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied',
      });
    }

    const summary = activityProfileChatService.getConversationSummary(stateResult.state);

    return res.json({
      success: true,
      data: {
        conversationId,
        activityId: stateResult.state.activityId,
        activityTitle: stateResult.state.activityTitle,
        phase: stateResult.state.phase,
        totalTurns: stateResult.state.totalTurns,
        summary,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/summary] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation summary',
    });
  }
});

// ============================================================================
// GET /activity-chat/profile/:activityId
// Get activity profile for an activity
// ============================================================================
activityChatRouter.get('/activity-chat/profile/:activityId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { activityId } = req.params;

    if (!activityId) {
      return res.status(400).json({
        success: false,
        error: 'activityId parameter is required',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    const result = await chatPersistenceService.loadProfile(profileId, activityId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Activity profile not found',
      });
    }

    return res.json({
      success: true,
      data: {
        activityId,
        profile: result.profile,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/profile] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get activity profile',
    });
  }
});

// ============================================================================
// GET /activity-chat/profiles
// Get all activity profiles for the user
// ============================================================================
activityChatRouter.get('/activity-chat/profiles', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    const result = await chatPersistenceService.loadAllProfiles(profileId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to load activity profiles',
      });
    }

    return res.json({
      success: true,
      data: {
        profiles: result.profiles,
        count: Object.keys(result.profiles ?? {}).length,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/profiles] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get activity profiles',
    });
  }
});

// ============================================================================
// POST /activity-chat/assess-need
// Check which activities need chat (batch assessment)
// ============================================================================
activityChatRouter.post('/activity-chat/assess-need', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { activityProfileChatService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat'
    );
    const { activityProfileService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/profile'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'activities must be a non-empty array',
      });
    }

    // Validate each activity has required fields
    for (const activity of activities) {
      if (!activity.id || !activity.title) {
        return res.status(400).json({
          success: false,
          error: 'Each activity must have an id and title',
        });
      }
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Assess each activity
    const assessments = await Promise.all(
      activities.map(async (activity: {
        id: string;
        title: string;
        description?: string;
        hoursPerWeek?: number;
        weeksPerYear?: number;
        yearsInvolved?: number;
      }) => {
        // Try to load existing profile
        const profileResult = await chatPersistenceService.loadProfile(profileId, activity.id);

        if (profileResult.success && profileResult.profile) {
          // Have existing profile - assess based on it
          const assessment = activityProfileChatService.assessConversationNeed(
            profileResult.profile,
            {
              currentDescriptionScore: undefined,
              portfolioRole: undefined,
            }
          );
          return {
            activityId: activity.id,
            activityTitle: activity.title,
            hasProfile: true,
            ...assessment,
          };
        }

        // No existing profile - create a minimal one to assess
        const minimalProfile = activityProfileService.createEmptyProfile(activity.id, activity.title);

        // Populate with basic data if available
        if (activity.hoursPerWeek) {
          minimalProfile.facts.duration.hoursPerWeek = activity.hoursPerWeek;
        }
        if (activity.yearsInvolved) {
          minimalProfile.facts.duration.totalYears = activity.yearsInvolved;
        }

        const assessment = activityProfileChatService.assessConversationNeed(minimalProfile);

        return {
          activityId: activity.id,
          activityTitle: activity.title,
          hasProfile: false,
          ...assessment,
        };
      })
    );

    // Sort by urgency (high first, then medium, then low)
    const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    assessments.sort((a, b) => {
      const aOrder = urgencyOrder[a.urgency] ?? 3;
      const bOrder = urgencyOrder[b.urgency] ?? 3;
      return aOrder - bOrder;
    });

    return res.json({
      success: true,
      data: {
        assessments,
        activitiesNeedingChat: assessments.filter(a => a.shouldInitiate).length,
        totalActivities: activities.length,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/assess-need] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assess chat needs',
    });
  }
});

// ============================================================================
// POST /activity-chat/generate-description
// Generate descriptions from a profile
// ============================================================================
activityChatRouter.post('/activity-chat/generate-description', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { profileDescriptionGenerator } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/profile'
    );
    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const { activityId, currentDescription, emphasis, studentContext } = req.body;

    if (!activityId) {
      return res.status(400).json({
        success: false,
        error: 'activityId is required',
      });
    }

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Load the activity profile
    const profileResult = await chatPersistenceService.loadProfile(profileId, activityId);
    if (!profileResult.success || !profileResult.profile) {
      return res.status(404).json({
        success: false,
        error: 'Activity profile not found. Start a conversation about this activity first.',
      });
    }

    // Check generation readiness
    const readiness = profileDescriptionGenerator.assessGenerationReadiness(profileResult.profile);

    if (!readiness.isReady) {
      return res.json({
        success: true,
        data: {
          isReady: false,
          readinessScore: readiness.readinessScore,
          missingElements: readiness.missingElements,
          recommendations: readiness.recommendations,
        },
      });
    }

    // Generate descriptions
    const result = await profileDescriptionGenerator.generateDescriptions({
      profile: profileResult.profile,
      currentDescription,
      emphasis,
      studentContext,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate descriptions',
      });
    }

    return res.json({
      success: true,
      data: {
        isReady: true,
        primary: result.primary,
        alternatives: result.alternatives,
        currentAnalysis: result.currentAnalysis,
        profileContribution: result.profileContribution,
        tokensUsed: result.tokensUsed,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/generate-description] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate description',
    });
  }
});

// ============================================================================
// GET /activity-chat/conversations
// List conversations for the user, optionally filtered by activityId
// ============================================================================
activityChatRouter.get('/activity-chat/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req, res);
    if (!userId) return;

    const { chatPersistenceService } = await import(
      '@/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService'
    );

    const profileId = await resolveProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // Optional query param for filtering by activity
    const activityId = req.query.activityId as string | undefined;

    const result = await chatPersistenceService.listConversations(profileId, activityId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to list conversations',
      });
    }

    return res.json({
      success: true,
      data: {
        conversations: result.conversations,
        count: result.conversations?.length ?? 0,
      },
    });
  } catch (error: unknown) {
    console.error('[activity-chat/conversations] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list conversations',
    });
  }
});

export default activityChatRouter;
