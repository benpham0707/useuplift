import { callClaudeWithRetry } from '@/lib/llm/claude';
import { HolisticUnderstanding } from '../types';

export interface TrimmingSuggestion {
    original_text: string;
    trimmed_text: string; // The "Better Version"
    rationale: string;
    type: 'clarity' | 'impact' | 'pacing';
}

const TRIMMING_SYSTEM_PROMPT = `You are a supportive, expert Writing Coach.
Your goal is to help the student tighten their essay to make it more impactful, NOT to strip away their voice.

**Philosophy:**
- **Don't Just Delete, Improve:** Instead of removing a sentence, show how to say it with more power and fewer "empty calories."
- **Preserve Emotion & Pacing:** Do NOT shorten sentences that are long for a reason (e.g., to create a sense of time slowing down, reflection, or rhythm). Only cut *unintentional* fluff.
- **Respect the Voice:** If the student's voice is "Poetic" or "Reflective", do not force them to be "Journalistic" or "Punchy" unless it hurts clarity.
- **Encouraging Tone:** Your rationale should be warm and educational. Explain *why* the change helps their story shine.

**Intent-Awareness Rules:**
1. **Check the Context:** Does this sentence establish a "Power Scene" or a "Deep Reflection"? If so, be very careful about cutting.
2. **Pause for Effect:** If the student says "I took a moment to...", they want the reader to slow down. Simplify the *phrasing*, but keep the *pause*.
   - *Bad Cut:* "Kickoff was coming." (Too fast, kills the moment)
   - *Good Cut:* "As the whistle loomed, I let the weight of the season settle on my shoulders." (Keeps the pause, removes the clunky words)

**Input:**
You will receive:
1. The Essay Text
2. The Holistic Context (Theme, Voice, Key Moments)

**Output:**
Return a JSON object with a "cuts" array. Each item:
{
  "original_text": "Exact string from essay",
  "trimmed_text": "The polished, tighter version (NOT just a summary)",
  "rationale": "Warm, supportive explanation of why this tightens the narrative while preserving the intent.",
  "type": "clarity" | "impact" | "pacing"
}

Select ONLY the top 3-5 opportunities for tightening.
`;

export async function generateTrimmingSuggestions(
    essayText: string,
    holisticContext?: HolisticUnderstanding
): Promise<TrimmingSuggestion[]> {
    console.log('✂️  Running Trimming Analyzer...');
    
    let promptContext = `Essay Text:\n"""\n${essayText}\n"""`;

    if (holisticContext) {
        promptContext += `\n\nHolistic Context:\n`;
        promptContext += `- Theme: ${holisticContext.centralTheme}\n`;
        promptContext += `- Primary Voice: ${holisticContext.primaryVoice}\n`;
        promptContext += `- Emotional Arc: ${holisticContext.emotionalArc}\n`;
        if (holisticContext.keyMoments) {
             promptContext += `- Key Moments to Preserve: ${holisticContext.keyMoments.map(k => k.description).join(', ')}\n`;
        }
    }

    try {
        const response = await callClaudeWithRetry(
            promptContext,
            {
                systemPrompt: TRIMMING_SYSTEM_PROMPT,
                temperature: 0.4, 
                useJsonMode: true,
                maxTokens: 1500
            }
        );

        if (typeof response.content === 'string') {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.cuts || [];
            }
        } else if (typeof response.content === 'object') {
             return (response.content as any).cuts || [];
        }
        
        return [];

    } catch (error) {
        console.error('❌ Trimming Analyzer failed:', error);
        return [];
    }
}

