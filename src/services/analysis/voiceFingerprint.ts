
import { callClaude } from '@/lib/llm/claude';

export interface VoiceFingerprint {
  tone: string; // e.g., "Earnest", "Analytical", "Whimsical"
  cadence: string; // e.g., "Short, punchy sentences", "Long, flowing clauses"
  vocabulary_level: string; // e.g., "High-school conversational", "Academic", "Simple"
  sentence_structure: string; // e.g., "Varied", "Repetitive Subject-Verb", "Complex"
  authenticity_markers: string[]; // e.g., "Uses specific slang", "Self-deprecating humor"
  summary: string; // A 1-sentence summary of the voice for the LLM to roleplay
}

export class VoiceFingerprintAnalyzer {
  
  /**
   * Analyzes the student's essay to extract their unique "Voice Fingerprint".
   * This fingerprint is used to constrain future edits so they sound authentic.
   */
  static async analyze(text: string): Promise<VoiceFingerprint> {
    console.log('[VoiceFingerprintAnalyzer] Extracting voice DNA...');

    const systemPrompt = `You are a Linguistic Forensic Analyst. 
    Your goal is to analyze a student's essay and extract their unique "Voice Fingerprint."
    
    We are NOT grading the essay. We are describing HOW they write so we can mimic it later.
    
    Analyze:
    1. **Tone:** What is the emotional quality? (Humble, Arrogant, Funny, Sad?)
    2. **Cadence/Rhythm:** Do they use fragments? Run-on sentences? Is it choppy or flowing?
    3. **Vocabulary:** do they use "SAT words" or simple language?
    4. **Authenticity Markers:** What makes this sound like THEM? (e.g., specific quirks, formatting, humor).
    
    Output strictly valid JSON.`;

    const userPrompt = `
    **ESSAY TEXT:**
    "${text}"
    
    **TASK:**
    Create a VoiceFingerprint JSON object.
    The "summary" field must be a direct instruction like: "Write in a humble, slightly self-deprecating tone using short sentences and simple vocabulary."
    `;

    try {
      const response = await callClaude<VoiceFingerprint>(userPrompt, {
        systemPrompt,
        model: 'claude-sonnet-4-20250514', // High intelligence for nuance
        temperature: 0.1, // Low temperature for consistent analysis
        maxTokens: 1000,
        useJsonMode: true
      });

      return response.content;

    } catch (error) {
      console.error('[VoiceFingerprintAnalyzer] Failed:', error);
      // Safe Fallback
      return {
        tone: "Neutral",
        cadence: "Standard",
        vocabulary_level: "Standard",
        sentence_structure: "Standard",
        authenticity_markers: [],
        summary: "Write in a standard, clear student voice."
      };
    }
  }
}

