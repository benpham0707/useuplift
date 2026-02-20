/**
 * Voice Profile Service
 *
 * Builds, enriches, and persists StudentVoiceProfiles.
 *
 * - buildFromSample: Creates a new profile from a writing sample (Haiku — fast, cheap)
 * - enrichProfile: Merges new sample data into an existing profile (Sonnet — nuanced)
 * - getPromptSummary: Compact text summary for LLM prompt injection (~500 tokens)
 * - fromCommonAppFingerprint / fromActivityChatFingerprint / fromPIQFingerprint:
 *     Converters from existing workshop voice data
 * - save / load: Supabase persistence
 */

import { callClaude } from '@/lib/llm/claude';
import { supabaseAdmin } from '@/supabase/admin';
import type { StudentVoiceProfile, AuthenticPhrase } from './types';
import type { VoiceFingerprint } from '../commonAppWorkshop/types/stage0Types';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

const VOICE_ANALYSIS_SYSTEM_PROMPT = `You are a Linguistic Voice Analyst specializing in college application essays.
Your job is to analyze a student's writing sample and extract a detailed voice profile.

Analyze:
1. REGISTER: What emotional register dominates? (energetic_enthusiasm, quiet_intensity, melancholy_loss, defiant_irreverent, wonder_curiosity, warmth_connection)
2. LINGUISTICS: Sentence length, variety, vocabulary level, formality, fragment usage, signature/avoid words
3. PERSONALITY: Energy, humor frequency, directness, emotional openness
4. AUTHENTIC PHRASES: 3-5 phrases that are distinctly this student's voice
5. WEAKNESSES: Where the voice breaks down (goes generic, loses energy, becomes stilted)
6. PRESERVATION WARNINGS: What must NOT be edited away (deliberate fragments, slang, patterns)

Return strictly valid JSON matching this schema:
{
  "register": { "primary": string, "secondary": string|null, "confidence": number(0-1) },
  "linguistics": {
    "averageSentenceLength": number,
    "sentenceLengthVariety": number(1-10),
    "vocabularyLevel": "sophisticated"|"clear"|"simple",
    "formality": "formal"|"semi-formal"|"casual",
    "fragmentUse": "effective"|"moderate"|"minimal",
    "signatureWords": string[],
    "avoidWords": string[]
  },
  "personality": {
    "energy": "high"|"medium"|"low",
    "humor": "frequent"|"occasional"|"rare",
    "directness": "very_direct"|"moderate"|"circumspect",
    "emotionalOpenness": "open"|"guarded"|"reserved"
  },
  "authenticPhrases": [{ "phrase": string, "preserveExactly": boolean }],
  "weaknesses": string[],
  "preservationWarnings": string[]
}`;

const VOICE_ENRICHMENT_SYSTEM_PROMPT = `You are a Linguistic Voice Analyst specializing in college application essays.
You have an EXISTING voice profile for this student and a NEW writing sample.

Your job is to produce an UPDATED profile that merges the new evidence with existing data.

Rules:
- If new data CONFIRMS existing observations, increase confidence
- If new data CONTRADICTS existing observations, note both and use the stronger evidence
- Add new authentic phrases but keep existing ones if they're still representative
- Update weaknesses only if new evidence changes the picture
- NEVER lose existing preservation warnings — only add to them

Return the same JSON schema as the original profile analysis.`;

// ============================================================================
// SERVICE
// ============================================================================

export class VoiceProfileService {

  /**
   * Build a new voice profile from a writing sample.
   * Uses Haiku for fast, cheap initial analysis.
   */
  async buildFromSample(
    userId: string,
    text: string,
    source: 'essay' | 'chat' | 'uploaded_sample'
  ): Promise<StudentVoiceProfile> {
    const response = await callClaude<{
      register: { primary: string; secondary: string | null; confidence: number };
      linguistics: StudentVoiceProfile['linguistics'];
      personality: StudentVoiceProfile['personality'];
      authenticPhrases: Array<{ phrase: string; preserveExactly: boolean }>;
      weaknesses: string[];
      preservationWarnings: string[];
    }>(`Analyze this writing sample and extract the student's voice profile:\n\n"${text}"`, {
      systemPrompt: VOICE_ANALYSIS_SYSTEM_PROMPT,
      model: HAIKU_MODEL,
      temperature: 0.2,
      maxTokens: 2000,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const data = response.content;
    const now = new Date().toISOString();

    return {
      userId,
      version: 1,
      createdAt: now,
      updatedAt: now,
      register: {
        primary: data.register.primary as StudentVoiceProfile['register']['primary'],
        secondary: data.register.secondary as StudentVoiceProfile['register']['secondary'],
        confidence: data.register.confidence,
      },
      linguistics: data.linguistics,
      personality: data.personality,
      authenticPhrases: data.authenticPhrases.map((p): AuthenticPhrase => ({
        phrase: p.phrase,
        source,
        preserveExactly: p.preserveExactly,
      })),
      weaknesses: data.weaknesses,
      preservationWarnings: data.preservationWarnings,
      confidence: data.register.confidence,
      sampleCount: 1,
      lastSampleAt: now,
    };
  }

  /**
   * Enrich an existing profile with a new writing sample.
   * Uses Sonnet for nuanced re-analysis that respects existing data.
   */
  async enrichProfile(
    userId: string,
    text: string,
    source: 'essay' | 'chat' | 'uploaded_sample'
  ): Promise<StudentVoiceProfile> {
    const existing = await this.load(userId);
    if (!existing) {
      return this.buildFromSample(userId, text, source);
    }

    const userPrompt = `EXISTING PROFILE:\n${JSON.stringify(existing, null, 2)}\n\nNEW WRITING SAMPLE:\n"${text}"\n\nProduce an updated voice profile that merges the new evidence.`;

    const response = await callClaude<{
      register: { primary: string; secondary: string | null; confidence: number };
      linguistics: StudentVoiceProfile['linguistics'];
      personality: StudentVoiceProfile['personality'];
      authenticPhrases: Array<{ phrase: string; preserveExactly: boolean }>;
      weaknesses: string[];
      preservationWarnings: string[];
    }>(userPrompt, {
      systemPrompt: VOICE_ENRICHMENT_SYSTEM_PROMPT,
      model: SONNET_MODEL,
      temperature: 0.3,
      maxTokens: 2000,
      useJsonMode: true,
    });

    const data = response.content;
    const now = new Date().toISOString();

    // Merge authentic phrases: keep existing + add new
    const existingPhraseSet = new Set(existing.authenticPhrases.map(p => p.phrase));
    const newPhrases: AuthenticPhrase[] = data.authenticPhrases
      .filter(p => !existingPhraseSet.has(p.phrase))
      .map((p): AuthenticPhrase => ({
        phrase: p.phrase,
        source,
        preserveExactly: p.preserveExactly,
      }));

    const mergedPhrases = [...existing.authenticPhrases, ...newPhrases];

    return {
      userId,
      version: existing.version + 1,
      createdAt: existing.createdAt,
      updatedAt: now,
      register: {
        primary: data.register.primary as StudentVoiceProfile['register']['primary'],
        secondary: data.register.secondary as StudentVoiceProfile['register']['secondary'],
        confidence: data.register.confidence,
      },
      linguistics: data.linguistics,
      personality: data.personality,
      authenticPhrases: mergedPhrases,
      weaknesses: data.weaknesses,
      preservationWarnings: data.preservationWarnings,
      confidence: data.register.confidence,
      sampleCount: existing.sampleCount + 1,
      lastSampleAt: now,
    };
  }

  /**
   * Return a compact text summary (~500 tokens) for LLM prompt injection.
   */
  getPromptSummary(profile: StudentVoiceProfile, _maxTokens?: number): string {
    const lines: string[] = [];

    lines.push('STUDENT VOICE PROFILE:');
    lines.push(`Register: ${profile.register.primary}${profile.register.secondary ? ` / ${profile.register.secondary}` : ''} (confidence: ${profile.register.confidence.toFixed(2)})`);
    lines.push(`Avg sentence: ${profile.linguistics.averageSentenceLength} words, variety: ${profile.linguistics.sentenceLengthVariety}/10`);
    lines.push(`Vocabulary: ${profile.linguistics.vocabularyLevel}, Formality: ${profile.linguistics.formality}, Fragments: ${profile.linguistics.fragmentUse}`);
    lines.push(`Personality: ${profile.personality.energy} energy, ${profile.personality.humor} humor, ${profile.personality.directness} directness, ${profile.personality.emotionalOpenness}`);

    if (profile.linguistics.signatureWords.length > 0) {
      lines.push(`Signature words: ${profile.linguistics.signatureWords.slice(0, 8).map(w => `"${w}"`).join(', ')}`);
    }

    if (profile.linguistics.avoidWords.length > 0) {
      lines.push(`Avoid: ${profile.linguistics.avoidWords.slice(0, 8).map(w => `"${w}"`).join(', ')}`);
    }

    if (profile.weaknesses.length > 0) {
      lines.push(`Weaknesses: ${profile.weaknesses.slice(0, 3).join('; ')}`);
    }

    if (profile.preservationWarnings.length > 0) {
      lines.push(`DO NOT CHANGE: ${profile.preservationWarnings.slice(0, 3).join('; ')}`);
    }

    if (profile.authenticPhrases.length > 0) {
      const preserved = profile.authenticPhrases
        .filter(p => p.preserveExactly)
        .slice(0, 3);
      if (preserved.length > 0) {
        lines.push(`Preserve exactly: ${preserved.map(p => `"${p.phrase}"`).join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Convert a VoiceFingerprint from Common App Stage 0 into a partial StudentVoiceProfile.
   */
  fromCommonAppFingerprint(fp: VoiceFingerprint): Partial<StudentVoiceProfile> {
    return {
      register: {
        primary: fp.dominant_register,
        confidence: 0.7,
      },
      linguistics: {
        averageSentenceLength: fp.sentence_rhythms.average_length,
        sentenceLengthVariety: fp.sentence_rhythms.variety,
        vocabularyLevel: fp.vocabulary_level,
        formality: 'semi-formal', // Default; fingerprint doesn't track this
        fragmentUse: fp.sentence_rhythms.fragment_use,
        signatureWords: [],
        avoidWords: [],
      },
      authenticPhrases: fp.authentic_phrases.map((phrase): AuthenticPhrase => ({
        phrase,
        source: 'essay',
        preserveExactly: true,
      })),
      weaknesses: fp.voice_weaknesses,
      preservationWarnings: fp.preservation_warnings,
    };
  }

  /**
   * Convert activity chat voice data into a partial StudentVoiceProfile.
   */
  fromActivityChatFingerprint(fp: Record<string, unknown>): Partial<StudentVoiceProfile> {
    // Activity chat stores voice data in varying shapes; extract what we can
    const tone = (fp.tone as string) || '';
    const vocabulary = (fp.vocabulary_level as string) || (fp.vocabularyLevel as string) || '';
    const markers = (fp.authenticity_markers as string[]) || (fp.authenticityMarkers as string[]) || [];

    return {
      linguistics: {
        averageSentenceLength: 15, // Default estimate
        sentenceLengthVariety: 5,
        vocabularyLevel: mapVocabularyLevel(vocabulary),
        formality: 'semi-formal',
        fragmentUse: 'moderate',
        signatureWords: [],
        avoidWords: [],
      },
      authenticPhrases: markers.map((m): AuthenticPhrase => ({
        phrase: m,
        source: 'chat',
        preserveExactly: false,
      })),
      weaknesses: [],
      preservationWarnings: tone ? [`Preserve ${tone.toLowerCase()} tone`] : [],
    };
  }

  /**
   * Convert PIQ voice data into a partial StudentVoiceProfile.
   */
  fromPIQFingerprint(fp: Record<string, unknown>): Partial<StudentVoiceProfile> {
    // PIQ stores voice fingerprint in a different shape (see piqChatContext.ts)
    const sentenceStructure = fp.sentenceStructure as { pattern?: string; example?: string } | undefined;
    const vocabulary = fp.vocabulary as { level?: string; signatureWords?: string[] } | undefined;
    const pacing = fp.pacing as { speed?: string; rhythm?: string } | undefined;
    const tone = fp.tone as { primary?: string; secondary?: string } | undefined;

    return {
      linguistics: {
        averageSentenceLength: 15, // Default estimate
        sentenceLengthVariety: 5,
        vocabularyLevel: mapVocabularyLevel(vocabulary?.level || ''),
        formality: 'semi-formal',
        fragmentUse: sentenceStructure?.pattern?.toLowerCase().includes('fragment') ? 'effective' : 'moderate',
        signatureWords: vocabulary?.signatureWords || [],
        avoidWords: [],
      },
      preservationWarnings: tone?.primary
        ? [`Preserve ${tone.primary} tone${tone.secondary ? ` with ${tone.secondary} undertones` : ''}`]
        : [],
    };
  }

  /**
   * Upsert a voice profile to Supabase.
   */
  async save(profile: StudentVoiceProfile): Promise<void> {
    const { error } = await supabaseAdmin
      .from('voice_profiles')
      .upsert({
        user_id: profile.userId,
        version: profile.version,
        profile: profile as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[VoiceProfileService] Failed to save profile:', error);
      throw new Error(`Failed to save voice profile: ${error.message}`);
    }
  }

  /**
   * Load a voice profile from Supabase.
   */
  async load(userId: string): Promise<StudentVoiceProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('voice_profiles')
      .select('profile')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned — user has no profile yet
        return null;
      }
      console.error('[VoiceProfileService] Failed to load profile:', error);
      throw new Error(`Failed to load voice profile: ${error.message}`);
    }

    return data?.profile as unknown as StudentVoiceProfile ?? null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function mapVocabularyLevel(level: string): 'sophisticated' | 'clear' | 'simple' {
  const lower = level.toLowerCase();
  if (lower.includes('sophist') || lower.includes('academic') || lower.includes('advanced')) {
    return 'sophisticated';
  }
  if (lower.includes('simple') || lower.includes('basic') || lower.includes('conversational')) {
    return 'simple';
  }
  return 'clear';
}

// ============================================================================
// SINGLETON
// ============================================================================

export const voiceProfileService = new VoiceProfileService();
