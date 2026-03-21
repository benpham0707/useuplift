/**
 * Conversation Manager
 *
 * Manages the state and flow of activity profile conversations.
 * Handles:
 * - State initialization and transitions
 * - Phase progression
 * - Profile updates from extractions
 * - Conversation lifecycle (start, process, end)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ConversationState,
  ConversationPhase,
  ConversationTurn,
  ConversationTrigger,
  AskedQuestion,
  ExtractedInformation,
  ExtractedField,
  ExtractedQuote,
  ImplicitFinding,
  ExtractionResult,
  StudentContext,
  OPENING_TEMPLATES,
  CLOSING_TEMPLATES,
} from './types';
import { ActivityProfile, createEmptyProfile, createProfileFromBasicData } from '../profile/types';
import { activityProfileService } from '../profile/activityProfileService';
import {
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  type MajorCategory,
  type ActivityCategory as AlignmentActivityCategory,
} from '../../../knowledge/majorActivityAlignment';
import { normalizeMajor } from '../../../knowledge/fieldSpecificExpectations';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_TURNS_PER_PHASE = 4;
const MAX_TOTAL_TURNS = 20;
const MIN_TURNS_BEFORE_END = 3;

/** Confidence levels ranked numerically for comparison */
const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

/** Minimum word-overlap ratio to consider two strings near-duplicates */
const SIMILARITY_THRESHOLD = 0.7;

// ============================================================================
// CONVERSATION MANAGER
// ============================================================================

export class ConversationManager {
  /**
   * Initialize a new conversation
   */
  initializeConversation(
    activityId: string,
    activityTitle: string,
    trigger: ConversationTrigger,
    options?: {
      existingProfile?: ActivityProfile;
      studentContext?: StudentContext;
      basicData?: {
        description?: string;
        position?: string;
        hoursPerWeek?: number;
        weeksPerYear?: number;
        yearsInvolved?: number;
        activityType?: string;
      };
    }
  ): ConversationState {
    // Create or use existing profile
    let profile: ActivityProfile;
    if (options?.existingProfile) {
      profile = { ...options.existingProfile };
    } else if (options?.basicData) {
      profile = createProfileFromBasicData(activityId, activityTitle, options.basicData);
    } else {
      profile = createEmptyProfile(activityId, activityTitle);
    }

    const now = new Date().toISOString();

    return {
      conversationId: uuidv4(),
      activityId,
      activityTitle,
      phase: 'opening',
      profileBeforeConversation: JSON.parse(JSON.stringify(profile)), // Deep clone
      currentProfile: profile,
      questionsAsked: [],
      responsesReceived: [],
      extractedInfo: {
        fields: [],
        quotes: [],
        implicit: [],
        updateHistory: [],
      },
      gapsRemaining: this.identifyInitialGaps(profile),
      turnsInCurrentPhase: 0,
      maxTurnsPerPhase: DEFAULT_MAX_TURNS_PER_PHASE,
      totalTurns: 0,
      startedAt: now,
      lastActivityAt: now,
      triggerReason: trigger,
      studentContext: options?.studentContext,
    };
  }

  /**
   * Generate opening message based on trigger
   */
  generateOpeningMessage(state: ConversationState): string {
    const template = OPENING_TEMPLATES[state.triggerReason];
    let message = template.replace(/{activityTitle}/g, state.activityTitle);

    // Add time investment if available
    const hours = state.currentProfile.facts.duration.hoursPerWeek;
    const years = state.currentProfile.facts.duration.totalYears;
    if (hours > 0) {
      message = message.replace(/{hours}/g, String(hours * 40 * (years || 1)));
    }
    if (years > 0) {
      message = message.replace(/{years}/g, String(years));
    }

    return message;
  }

  /**
   * Record a question that was asked
   */
  recordQuestion(
    state: ConversationState,
    question: string,
    targetField: string,
    category: string
  ): ConversationState {
    const askedQuestion: AskedQuestion = {
      question,
      targetField,
      category: category as AskedQuestion['category'],
      askedAt: new Date().toISOString(),
      turnNumber: state.totalTurns + 1,
    };

    return {
      ...state,
      questionsAsked: [...state.questionsAsked, askedQuestion],
      lastActivityAt: new Date().toISOString(),
    };
  }

  /**
   * Process a response and update state
   */
  processResponse(
    state: ConversationState,
    response: string,
    extraction: ExtractionResult,
    question: string
  ): ConversationState {
    const turnNumber = state.totalTurns + 1;
    const now = new Date().toISOString();

    // Create turn record
    const turn: ConversationTurn = {
      turnNumber,
      question,
      response,
      extraction,
      timestamp: now,
    };

    // Update extracted info
    const updatedExtractedInfo = this.updateExtractedInfo(state.extractedInfo, extraction, turnNumber);

    // Update profile with extracted fields
    const updatedProfile = this.applyExtractionToProfile(state.currentProfile, extraction);

    // Compute major alignment from the scoring matrix when intended major is known
    // This bridges the gap between the alignment matrix (which is correct) and
    // the profile's relevantToMajor boolean (which defaults to false and was never populated)
    this.computeMajorAlignment(updatedProfile, state.studentContext?.intendedMajor);

    // Update gaps
    const completeness = activityProfileService.calculateCompleteness(updatedProfile);
    const gapsRemaining = completeness.priorityFields
      .filter(f => !f.currentlyFilled && f.importance !== 'low')
      .map(f => f.field);

    return {
      ...state,
      responsesReceived: [...state.responsesReceived, turn],
      extractedInfo: updatedExtractedInfo,
      currentProfile: updatedProfile,
      gapsRemaining,
      turnsInCurrentPhase: state.turnsInCurrentPhase + 1,
      totalTurns: turnNumber,
      lastActivityAt: now,
    };
  }

  /**
   * Transition to a new phase
   */
  transitionPhase(state: ConversationState, newPhase: ConversationPhase): ConversationState {
    return {
      ...state,
      phase: newPhase,
      turnsInCurrentPhase: 0,
      lastActivityAt: new Date().toISOString(),
    };
  }

  /**
   * Check if conversation should end
   */
  shouldEndConversation(state: ConversationState): {
    shouldEnd: boolean;
    reason?: 'complete' | 'low_engagement' | 'max_turns';
  } {
    // Don't end before minimum turns
    if (state.totalTurns < MIN_TURNS_BEFORE_END) {
      return { shouldEnd: false };
    }

    // End if max turns reached
    if (state.totalTurns >= MAX_TOTAL_TURNS) {
      return { shouldEnd: true, reason: 'max_turns' };
    }

    // End if profile is sufficiently complete
    if (state.currentProfile.dataCompleteness >= 80) {
      return { shouldEnd: true, reason: 'complete' };
    }

    // End if in synthesis/complete phase
    if (state.phase === 'complete' || (state.phase === 'synthesis' && state.turnsInCurrentPhase >= 2)) {
      return { shouldEnd: true, reason: 'complete' };
    }

    // Check for low engagement (short responses)
    const recentTurns = state.responsesReceived.slice(-3);
    if (recentTurns.length >= 3) {
      const avgWordCount = recentTurns.reduce(
        (sum, turn) => sum + turn.response.split(' ').length,
        0
      ) / recentTurns.length;

      const allSparse = recentTurns.every(t => t.extraction.extractionQuality === 'sparse' || t.extraction.extractionQuality === 'empty');

      if (avgWordCount < 10 && allSparse) {
        return { shouldEnd: true, reason: 'low_engagement' };
      }
    }

    return { shouldEnd: false };
  }

  /**
   * Generate closing message
   */
  generateClosingMessage(
    state: ConversationState,
    reason: 'complete' | 'low_engagement' | 'user_requested' | 'max_turns'
  ): string {
    const template = CLOSING_TEMPLATES[reason];
    return template.replace(/{activityTitle}/g, state.activityTitle);
  }

  /**
   * Generate conversation summary
   */
  generateSummary(state: ConversationState): {
    whatWeLearned: string[];
    completenessBefore: number;
    completenessAfter: number;
    keyQuotes: string[];
    remainingGaps: string[];
    estimatedScoreImpact: { description: number; activity: number; portfolio: number };
  } {
    const completenessBefore = state.profileBeforeConversation.dataCompleteness;
    const completenessAfter = state.currentProfile.dataCompleteness;

    // Summarize what we learned
    const whatWeLearned: string[] = [];
    if (state.extractedInfo.fields.length > 0) {
      const fieldCategories = new Set(state.extractedInfo.fields.map(f => f.path.split('.')[0]));
      if (fieldCategories.has('facts')) whatWeLearned.push('Captured concrete details and metrics');
      if (fieldCategories.has('story')) whatWeLearned.push('Learned about key moments and experiences');
      if (fieldCategories.has('meaning')) whatWeLearned.push('Understood personal significance');
      if (fieldCategories.has('impact')) whatWeLearned.push('Documented impact on others');
      if (fieldCategories.has('connections')) whatWeLearned.push('Connected to broader narrative');
    }

    // Get key quotes
    const keyQuotes = state.extractedInfo.quotes
      .filter(q => q.potentialUse === 'description' || q.potentialUse === 'essay')
      .slice(0, 3)
      .map(q => q.quote);

    // Calculate score impact estimate
    const improvement = (completenessAfter - completenessBefore) / 100;
    const estimatedScoreImpact = {
      description: Math.round(improvement * 3 * 10) / 10,
      activity: Math.round(improvement * 1.5 * 10) / 10,
      portfolio: Math.round(improvement * 1 * 10) / 10,
    };

    return {
      whatWeLearned,
      completenessBefore,
      completenessAfter,
      keyQuotes,
      remainingGaps: state.gapsRemaining.slice(0, 5),
      estimatedScoreImpact,
    };
  }

  /**
   * Finalize the profile after conversation ends
   */
  finalizeProfile(state: ConversationState): ActivityProfile {
    // Add conversation record to profile metadata
    const conversationRecord = {
      timestamp: state.startedAt,
      questionsAsked: state.questionsAsked.map(q => q.question),
      newInfoExtracted: state.extractedInfo.fields.map(f => f.path),
      fieldsUpdated: [...new Set(state.extractedInfo.fields.map(f => f.path))],
      completenessBefore: state.profileBeforeConversation.dataCompleteness,
      completenessAfter: state.currentProfile.dataCompleteness,
    };

    const finalProfile = activityProfileService.updateProfile(
      state.currentProfile,
      {},
      conversationRecord
    );

    return finalProfile;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Identify initial gaps in the profile
   */
  private identifyInitialGaps(profile: ActivityProfile): string[] {
    const completeness = activityProfileService.calculateCompleteness(profile);
    return completeness.priorityFields
      .filter(f => !f.currentlyFilled && f.importance !== 'low')
      .map(f => f.field);
  }

  /**
   * Update extracted info with new extraction, deduplicating across turns.
   *
   * For fields with the same path:
   *   - Scalar paths: keep the entry with higher confidence (newer wins ties)
   *   - Array-append paths: keep all unique entries
   * For quotes: skip near-duplicates (word overlap > SIMILARITY_THRESHOLD)
   * For implicit findings: skip near-duplicate observations
   */
  private updateExtractedInfo(
    current: ExtractedInformation,
    extraction: ExtractionResult,
    turnNumber: number
  ): ExtractedInformation {
    // --- Merge fields with dedup ---
    const mergedFields = this.deduplicateFields(current.fields, extraction.extractedFields);

    // --- Merge quotes with similarity dedup ---
    const mergedQuotes = this.deduplicateQuotes(current.quotes, extraction.authenticQuotes);

    // --- Merge implicit findings with similarity dedup ---
    const mergedImplicit = this.deduplicateImplicit(current.implicit, extraction.implicitFindings);

    return {
      fields: mergedFields,
      quotes: mergedQuotes,
      implicit: mergedImplicit,
      updateHistory: [
        ...current.updateHistory,
        {
          turnNumber,
          fieldsUpdated: extraction.extractedFields.map(f => f.path),
        },
      ],
    };
  }

  /**
   * Apply extraction results to the profile.
   *
   * DESIGN: All field updates are applied first WITHOUT per-field metadata
   * updates (version, completeness). Metadata is updated ONCE at the end
   * of the batch to avoid:
   * - profileVersion incrementing per field instead of per turn
   * - completeness being recalculated N times for N fields
   * - inconsistent intermediate states
   *
   * Guards:
   * - Low-confidence scalar extractions do NOT overwrite existing values
   * - Fields flagged as contradictions in needsClarification are SKIPPED
   * - Array fields always APPEND+DEDUP regardless of updateType
   * - Empty/null values never overwrite existing meaningful data
   * - Quotes are deduplicated by string similarity before adding
   * - Character traits are deduplicated by trait name before adding
   */
  private applyExtractionToProfile(
    profile: ActivityProfile,
    extraction: ExtractionResult
  ): ActivityProfile {
    // Deep clone once — setProfileFieldInPlace will mutate in place
    const updatedProfile: ActivityProfile = JSON.parse(JSON.stringify(profile));

    // Collect contradiction paths so we can skip those fields
    const contradictionPaths = new Set<string>();
    for (const clarification of extraction.needsClarification) {
      if (clarification.topic.startsWith('contradiction:')) {
        const contradictedField = clarification.topic.replace('contradiction:', '').trim();
        contradictionPaths.add(contradictedField);
      }
    }

    for (const field of extraction.extractedFields) {
      // Skip fields with active contradictions — wait for student clarification
      if (contradictionPaths.has(field.path)) {
        console.log(
          `[ConversationManager] Skipping contradicted field "${field.path}" — awaiting clarification`
        );
        continue;
      }

      // Confidence guard: for non-append scalar fields, skip low-confidence
      // extractions when the profile already has a meaningful value at that path.
      if (field.updateType !== 'append' && field.confidence === 'low') {
        const existingValue = this.getProfileFieldValue(updatedProfile, field.path);
        if (ConversationManager.isMeaningfulValue(existingValue)) {
          continue;
        }
      }

      // Apply field in place (no per-field clone or metadata update)
      this.setProfileFieldInPlace(updatedProfile, field.path, field.value, field.updateType);
    }

    // Add authentic quotes — deduplicate against existing quotes in profile
    for (const quote of extraction.authenticQuotes) {
      const isDuplicate = updatedProfile.meaning.authenticQuotes.some(
        existing => ConversationManager.areSimilarStrings(existing.quote, quote.quote)
      );
      if (!isDuplicate) {
        updatedProfile.meaning.authenticQuotes.push({
          quote: quote.quote,
          context: quote.context,
          potentialUse: quote.potentialUse,
        });
      }
    }

    // Apply implicit character traits if high confidence
    for (const implicit of extraction.implicitFindings) {
      if (implicit.confidence === 'high' && implicit.relatedField?.includes('characterTraits')) {
        const traitMatch = implicit.observation.match(/demonstrates?\s+(\w+)/i);
        if (traitMatch) {
          const trait = traitMatch[1].toLowerCase();
          const validTraits = ['leadership', 'innovation', 'resilience', 'curiosity', 'empathy', 'discipline', 'creativity', 'integrity', 'collaboration', 'initiative', 'perseverance'];
          if (validTraits.includes(trait)) {
            const traitExists = updatedProfile.connections.characterTraits.some(
              existing => existing.trait === trait
            );
            if (!traitExists) {
              updatedProfile.connections.characterTraits.push({
                trait: trait as any,
                howDemonstrated: implicit.basis,
              });
            }
          }
        }
      }
    }

    // === BATCH METADATA UPDATE (once per turn, not per field) ===
    updatedProfile.profileVersion = profile.profileVersion + 1;
    updatedProfile.lastUpdated = new Date().toISOString();

    // Recalculate completeness ONCE after all fields are applied
    const completeness = activityProfileService.calculateCompleteness(updatedProfile);
    updatedProfile.dataCompleteness = completeness.overall;

    return updatedProfile;
  }

  /**
   * Compute major alignment using the knowledge-base alignment matrix.
   *
   * This bridges the gap between:
   * - MAJOR_ACTIVITY_ALIGNMENT_MATRIX (which correctly scores Robotics+Engineering = 5/5)
   * - ActivityProfile.connections.majorAlignment.relevantToMajor (which defaulted to false)
   *
   * Without this, ALL activities show "Not aligned with intended major" regardless of
   * actual alignment — a trust-destroying bug identified in the output quality audit.
   */
  private computeMajorAlignment(profile: ActivityProfile, intendedMajor?: string): void {
    if (!intendedMajor) return;

    // Map free-text major to MajorCategory
    let majorCategory: MajorCategory;
    try {
      majorCategory = normalizeMajor(intendedMajor);
    } catch {
      // If the major can't be resolved, don't override the default
      return;
    }

    // Map activity category to alignment matrix key
    // Use activity title + category to determine the best alignment key
    const categoryKey = this.mapToAlignmentKey(profile);

    // Look up alignment score from the matrix
    const majorMatrix = MAJOR_ACTIVITY_ALIGNMENT_MATRIX[majorCategory];
    if (!majorMatrix) return;

    const alignmentScore = majorMatrix[categoryKey as AlignmentActivityCategory] ?? 2;

    // Convert score to relevantToMajor boolean and type
    const isRelevant = alignmentScore >= 3; // 3+ = complementary or better = relevant
    const alignmentType =
      alignmentScore >= 5 ? 'core' :
      alignmentScore >= 4 ? 'strong' :
      alignmentScore >= 3 ? 'complementary' :
      'neutral';

    // Populate the profile's majorAlignment — this was the missing bridge
    profile.connections.majorAlignment.relevantToMajor = isRelevant;

    // Only set howRelevant if we have genuine alignment (score >= 3)
    if (isRelevant && !profile.connections.majorAlignment.howRelevant) {
      profile.connections.majorAlignment.howRelevant =
        `${alignmentType} alignment with ${intendedMajor} (${alignmentScore}/5)`;
    }
  }

  /**
   * Map an activity profile to the best alignment matrix key.
   * Uses activity title keywords and existing category to find the right domain.
   */
  private mapToAlignmentKey(profile: ActivityProfile): string {
    const title = (profile.activityTitle || '').toLowerCase();

    // Title-based classification (more accurate than category alone)
    // These keywords map to specific alignment matrix categories
    if (/robot|mechatron|arduino|circuit|hardware/.test(title)) return 'stem_clubs';
    if (/debate|speech|forensic|model.?un/.test(title)) return 'debate_speech';
    if (/math|olympiad|amc|aime|mathcount/.test(title)) return 'stem_competitions';
    if (/research|lab|experiment/.test(title)) return 'stem_research';
    if (/code|coding|program|hack|software|app|web|cs\b/.test(title)) return 'stem_clubs';
    if (/orchestra|band|choir|music|piano|violin/.test(title)) return 'performing_arts_music';
    if (/theater|theatre|drama|act/.test(title)) return 'performing_arts_theater';
    if (/dance/.test(title)) return 'performing_arts_dance';
    if (/art|paint|draw|sculpt|photo|film/.test(title)) return 'visual_arts';
    if (/newspaper|journal|writing|literary|magazine/.test(title)) return 'writing_journalism';
    if (/student.?gov|student.?council|class.?president/.test(title)) return 'student_government';
    if (/business|entrepreneur|startup|venture/.test(title)) return 'entrepreneurship';
    if (/intern/.test(title)) return 'internships';
    if (/volunt|service|community|nonprofit/.test(title)) return 'nonprofit_service';
    if (/athlet|sport|team|varsity|captain|basketball|football|soccer|tennis|swim|track|cross.?country/.test(title)) return 'athletics';
    if (/science.?olympiad|science.?bowl|science.?fair/.test(title)) return 'academic_teams';

    // Fallback: use the profile's category field if available
    const categoryMapping: Record<string, string> = {
      academic_competition: 'academic_teams',
      research: 'stem_research',
      stem_project: 'stem_clubs',
      arts_performance: 'performing_arts_music',
      arts_visual: 'visual_arts',
      arts_literary: 'writing_journalism',
      athletics: 'athletics',
      community_service: 'nonprofit_service',
      leadership_governance: 'student_government',
      entrepreneurship: 'entrepreneurship',
      work_experience: 'work_experience',
      internship: 'internships',
      summer_program: 'internships',
    };

    // Try to get category from the profile metadata or generated data
    const profileCategory = (profile.metadata as Record<string, unknown>)?.activityCategory as string | undefined;
    if (profileCategory && categoryMapping[profileCategory]) {
      return categoryMapping[profileCategory];
    }

    return 'work_experience'; // safe fallback
  }

  /**
   * Read a nested field value from the profile by dot-separated path.
   */
  private getProfileFieldValue(profile: ActivityProfile, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = profile;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  /**
   * Set a field in the profile IN PLACE (no clone, no metadata update).
   *
   * Called by applyExtractionToProfile for each extracted field.
   * Metadata (version, completeness, lastUpdated) is updated ONCE
   * after all fields have been applied — see applyExtractionToProfile.
   *
   * Array handling:
   *   - If existing value is an array, ALWAYS append+dedup regardless of
   *     updateType. The LLM sometimes returns updateType: "new" for the
   *     first extraction of an array field, which would wipe previous
   *     turns' data if taken literally. Safe accumulation is always correct.
   *
   * Nested object handling:
   *   - If existing value is a plain object and new value is also an object,
   *     shallow-merge new keys into existing (preserving existing keys that
   *     are not present in the new value).
   *
   * Scalar handling:
   *   - Empty/null/undefined new values NEVER overwrite existing meaningful data.
   *   - Non-empty new values replace existing values (most recent wins).
   */
  private setProfileFieldInPlace(
    profile: ActivityProfile,
    path: string,
    value: unknown,
    updateType: 'new' | 'update' | 'append'
  ): void {
    const parts = path.split('.');

    // Navigate to the parent object
    let current: unknown = profile;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return; // Invalid path — bail out silently
      }
    }

    if (!current || typeof current !== 'object') return;

    const lastPart = parts[parts.length - 1];
    const obj = current as Record<string, unknown>;
    const existingValue = obj[lastPart];

    // ---- ARRAY FIELDS: always append + dedup ----
    // Regardless of updateType, arrays accumulate. This prevents the LLM
    // from accidentally wiping turn 1's recognition by saying "new" in turn 3.
    if (Array.isArray(existingValue)) {
      const newItems = Array.isArray(value) ? value : (value != null ? [value] : []);
      for (const item of newItems) {
        if (!ConversationManager.isArrayItemDuplicate(existingValue, item)) {
          existingValue.push(item);
        }
      }
      return;
    }

    // ---- NESTED OBJECT FIELDS: shallow merge ----
    // e.g., impact.beforeAfter, story.origin, connections.spikeRelevance
    // Merge new keys into existing object without losing existing keys.
    if (
      existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue) &&
      value && typeof value === 'object' && !Array.isArray(value)
    ) {
      const existingObj = existingValue as Record<string, unknown>;
      const newObj = value as Record<string, unknown>;
      for (const key of Object.keys(newObj)) {
        const newVal = newObj[key];
        // Only overwrite if the new value is meaningful
        if (ConversationManager.isMeaningfulValue(newVal)) {
          // If the existing sub-field is an array, append instead of replace
          if (Array.isArray(existingObj[key])) {
            const subItems = Array.isArray(newVal) ? newVal : [newVal];
            for (const item of subItems) {
              if (!ConversationManager.isArrayItemDuplicate(existingObj[key] as unknown[], item)) {
                (existingObj[key] as unknown[]).push(item);
              }
            }
          } else {
            existingObj[key] = newVal;
          }
        }
      }
      return;
    }

    // ---- SCALAR FIELDS: replace only if new value is meaningful ----
    if (!ConversationManager.isMeaningfulValue(value)) {
      // New value is empty/null/undefined — keep existing data intact
      return;
    }

    obj[lastPart] = value;
  }

  /**
   * Check if a value is meaningful (non-empty, non-null, non-zero-for-numbers).
   */
  static isMeaningfulValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  // ============================================================================
  // DEDUPLICATION HELPERS
  // ============================================================================

  /**
   * Deduplicate extracted fields across turns.
   *
   * For scalar paths (numeric fields, strings): keep the higher-confidence
   * entry; on tie keep the newer one (later in the array).
   * For append paths: keep all entries (the actual array dedup happens in
   * setProfileFieldInPlace when applying to the profile).
   */
  private deduplicateFields(
    existing: ExtractedField[],
    incoming: ExtractedField[]
  ): ExtractedField[] {
    const result = [...existing];

    for (const newField of incoming) {
      if (newField.updateType === 'append') {
        // Append fields accumulate; profile-level dedup handles array items
        result.push(newField);
        continue;
      }

      // For scalar fields, check if we already have an entry at this path
      const existingIndex = result.findIndex(
        f => f.path === newField.path && f.updateType !== 'append'
      );

      if (existingIndex === -1) {
        result.push(newField);
      } else {
        // Keep higher confidence; on tie keep newer (incoming)
        const oldRank = CONFIDENCE_RANK[result[existingIndex].confidence] ?? 0;
        const newRank = CONFIDENCE_RANK[newField.confidence] ?? 0;
        if (newRank >= oldRank) {
          result[existingIndex] = newField;
        }
        // else: old value had higher confidence, keep it
      }
    }

    return result;
  }

  /**
   * Deduplicate quotes across turns using word-overlap similarity.
   */
  private deduplicateQuotes(
    existing: ExtractedQuote[],
    incoming: ExtractedQuote[]
  ): ExtractedQuote[] {
    const result = [...existing];

    for (const newQuote of incoming) {
      const isDuplicate = result.some(
        q => ConversationManager.areSimilarStrings(q.quote, newQuote.quote)
      );
      if (!isDuplicate) {
        result.push(newQuote);
      }
    }

    return result;
  }

  /**
   * Deduplicate implicit findings across turns using observation similarity.
   */
  private deduplicateImplicit(
    existing: ImplicitFinding[],
    incoming: ImplicitFinding[]
  ): ImplicitFinding[] {
    const result = [...existing];

    for (const newFinding of incoming) {
      const isDuplicate = result.some(
        f => ConversationManager.areSimilarStrings(f.observation, newFinding.observation)
      );
      if (!isDuplicate) {
        result.push(newFinding);
      }
    }

    return result;
  }

  /**
   * Determine whether a candidate item is a duplicate of something already
   * in the array. Uses key-field matching for known profile object shapes,
   * falling back to JSON.stringify for exact dedup.
   */
  static isArrayItemDuplicate(existingArray: unknown[], candidate: unknown): boolean {
    if (candidate === null || candidate === undefined) return true;

    // Primitive items (strings, numbers): exact match
    if (typeof candidate !== 'object') {
      return existingArray.includes(candidate);
    }

    const obj = candidate as Record<string, unknown>;

    // Key-field strategy: check common identifier fields
    // recognition / artifacts: "name"
    // roles: "role"
    // skills: "skill"
    // values: "value"
    // personalGrowth: "area"
    // keyMoments: "description"
    // evolution: "phase"
    // relationships: "description" + "type"
    // directBeneficiaries: "who"
    // characterTraits: "trait"
    const keyFields: Array<{ key: string; secondary?: string }> = [
      { key: 'name' },
      { key: 'role' },
      { key: 'skill' },
      { key: 'value' },
      { key: 'area' },
      { key: 'trait' },
      { key: 'who' },
      { key: 'quote' },
    ];

    for (const { key } of keyFields) {
      if (obj[key] !== undefined && typeof obj[key] === 'string') {
        const candidateKey = (obj[key] as string).toLowerCase().trim();
        return existingArray.some(existing => {
          if (existing && typeof existing === 'object') {
            const existingKey = ((existing as Record<string, unknown>)[key] as string | undefined);
            if (existingKey && typeof existingKey === 'string') {
              return existingKey.toLowerCase().trim() === candidateKey
                || ConversationManager.areSimilarStrings(existingKey, candidateKey);
            }
          }
          return false;
        });
      }
    }

    // Fallback: JSON.stringify exact match
    const candidateJson = JSON.stringify(candidate);
    return existingArray.some(item => JSON.stringify(item) === candidateJson);
  }

  /**
   * Check whether two strings are near-duplicates based on word overlap.
   * Returns true if they share more than SIMILARITY_THRESHOLD of their words.
   */
  static areSimilarStrings(a: string, b: string): boolean {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    if (wordsA.size === 0 && wordsB.size === 0) return true;
    if (wordsA.size === 0 || wordsB.size === 0) return false;

    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) overlap++;
    }

    const smaller = Math.min(wordsA.size, wordsB.size);
    return overlap / smaller >= SIMILARITY_THRESHOLD;
  }
}

// Export singleton
export const conversationManager = new ConversationManager();
