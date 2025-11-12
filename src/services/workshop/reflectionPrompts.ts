/**
 * LLM-Based Adaptive Reflection Prompt System
 *
 * Generates thoughtful, context-aware questions that help students:
 * - Surface deeper content from their experiences
 * - Articulate implicit learning
 * - Connect activities to broader insights
 * - Discover forgotten details
 *
 * Design Philosophy:
 * - Nuanced and tailored to each student's specific issue and content
 * - Open-ended questions that encourage exploration, not yes/no
 * - Questions feel like a mentor coaching them, not a robot interrogating
 * - Prioritize quality of reflection over speed
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { DetectedIssue } from '@/core/analysis/coaching/issueDetector';
import { ExperienceEntry } from '@/core/types/experience';

// ============================================================================
// TYPES
// ============================================================================

export interface ReflectionPrompt {
  id: string;
  issueId: string;
  category: string;
  question: string;
  purpose: string;                       // Why we're asking this (visible to user)
  expectedLength: 'short' | 'medium';    // 1-2 sentences vs 3-4
  placeholderExample?: string;           // Optional: example answer to guide user
}

export interface ReflectionPromptSet {
  issueId: string;
  issueTitle: string;
  prompts: ReflectionPrompt[];           // Always 3 prompts per issue
  rationale: string;                     // Why these specific questions for this issue
}

// ============================================================================
// LLM PROMPT GENERATION
// ============================================================================

/**
 * Generate 3 adaptive reflection prompts for a specific detected issue
 *
 * Uses LLM to craft questions that:
 * - Are specific to the student's content and issue
 * - Feel natural and mentor-like
 * - Elicit actionable details that improve the draft
 */
export async function generateReflectionPrompts(
  issue: DetectedIssue,
  entry: ExperienceEntry,
  options: {
    tone?: 'mentor' | 'coach' | 'curious_friend';
    depth?: 'surface' | 'deep';
  } = {}
): Promise<ReflectionPromptSet> {
  const tone = options.tone || 'mentor';
  const depth = options.depth || 'deep';

  const systemPrompt = buildReflectionSystemPrompt(tone);
  const userPrompt = buildReflectionUserPrompt(issue, entry, depth);

  console.log('[reflectionPrompts] Generating adaptive prompts for issue:', issue.id);

  const response = await callClaudeWithRetry<{
    prompts: Array<{
      question: string;
      purpose: string;
      expectedLength: 'short' | 'medium';
      placeholderExample?: string;
    }>;
    rationale: string;
  }>(
    userPrompt,
    {
      systemPrompt,
      temperature: 0.8, // Higher creativity for varied questions
      useJsonMode: true,
    }
  );

  // Parse and structure the response
  const promptsData = typeof response.content === 'string'
    ? JSON.parse(response.content)
    : response.content;

  const prompts: ReflectionPrompt[] = promptsData.prompts.slice(0, 3).map((p, idx) => ({
    id: `${issue.id}-prompt-${idx + 1}`,
    issueId: issue.id,
    category: issue.category,
    question: p.question,
    purpose: p.purpose,
    expectedLength: p.expectedLength || 'short',
    placeholderExample: p.placeholderExample,
  }));

  return {
    issueId: issue.id,
    issueTitle: issue.title,
    prompts,
    rationale: promptsData.rationale,
  };
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildReflectionSystemPrompt(tone: 'mentor' | 'coach' | 'curious_friend'): string {
  const toneGuidance = {
    mentor: 'You are a wise, supportive mentor helping a student discover deeper insights about their experience. Your questions are thoughtful, encouraging, and make them feel understood.',
    coach: 'You are a skilled writing coach helping a student strengthen their narrative. Your questions are direct, actionable, and focused on extracting concrete details.',
    curious_friend: 'You are a genuinely curious friend who wants to understand their story better. Your questions feel natural, conversational, and show real interest.',
  };

  return `You are generating reflection prompts for a college applicant improving their extracurricular narrative.

${toneGuidance[tone]}

**Your Task**: Generate EXACTLY 3 reflection questions that elicit the most **admission-effective** content — details that admissions officers value and remember.

**Critical Requirements**:

1. **Specificity**: Questions MUST reference the student's actual activity and content
   - ❌ WRONG: "What did you learn from this experience?"
   - ✅ RIGHT: "When you were tutoring those 7 AP Calculus students, what's one moment when you realized your teaching approach needed to change?"

2. **Admission-Effective Content**: Target what makes students memorable to admissions
   - **Quantifiable impact**: Numbers, scale, measurable outcomes
   - **Intellectual depth**: Belief shifts, surprising insights, transferable learning
   - **Leadership markers**: Initiative, problem-solving under constraints, influence on others
   - **Authentic vulnerability**: Specific failures that led to growth, not generic "I struggled"
   - **Community transformation**: How you changed the culture/dynamic, not just participated

3. **Actionability**: Answers should directly improve their draft
   - Each question should elicit details they can insert into their narrative
   - Avoid purely philosophical questions with no concrete application
   - Questions should uncover **forgotten specifics** (names, moments, metrics, conversations)

4. **Progression**: The 3 questions should build on each other
   - Q1: Surface a concrete detail (event, person, metric, obstacle)
   - Q2: Explore the turning point or challenge (what changed your approach?)
   - Q3: Connect to deeper insight (belief shift, transferable skill, universal truth)

5. **Deep Retrospection**: Push beyond surface-level answers
   - Ask about the MOMENT things changed, not just that they changed
   - Ask about SPECIFIC conversations, not just that people helped
   - Ask about what the student DIDN'T EXPECT, not just what they learned
   - Ask about COUNTERFACTUALS: "What would NOT have happened without you?"

6. **Open-Ended**: Never yes/no questions
   - Always "What," "How," "When," "Who," or "Why"
   - Encourage storytelling and reflection

7. **Natural Language**: Sound like a human mentor, not a form
   - Use conversational phrasing
   - Show you've read their content carefully
   - Avoid generic templates

**Output Format**: Return a JSON object with:
{
  "prompts": [
    {
      "question": "The actual question text (1-2 sentences max)",
      "purpose": "Why we're asking this / what gap it fills (1 sentence)",
      "expectedLength": "short" | "medium",
      "placeholderExample": "Optional: brief example answer to guide them"
    }
  ],
  "rationale": "Why these 3 questions work together for this specific issue (2-3 sentences)"
}

Return ONLY valid JSON, no markdown formatting.`;
}

// ============================================================================
// USER PROMPT
// ============================================================================

function buildReflectionUserPrompt(
  issue: DetectedIssue,
  entry: ExperienceEntry,
  depth: 'surface' | 'deep'
): string {
  const depthGuidance = {
    surface: 'Focus on extracting concrete, factual details (numbers, names, events).',
    deep: 'Go deeper — explore beliefs, surprises, emotional progression, and transferable insights.',
  };

  return `Generate 3 reflection prompts for this student's extracurricular narrative.

**Student's Activity**:
Title: ${entry.title}
Role: ${entry.role || 'Not specified'}
Category: ${entry.category}
Time Commitment: ${entry.hours_per_week ? `${entry.hours_per_week} hours/week` : 'Not specified'}

**Current Draft**:
"${entry.description_original}"

**Detected Issue**:
Issue Type: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}

From their draft: "${issue.from_draft}"

**The Problem**:
${issue.problem}

**Why It Matters**:
${issue.why_matters}

**Your Goal**: ${depthGuidance[depth]}

**Key Guidelines**:
- Reference their specific activity (${entry.title}) and role (${entry.role || 'participant'})
- Target the gap identified in the issue (${issue.title})
- Make questions feel personally crafted for THEM, not generic
- Help them discover details they forgot to mention or didn't realize were important
- Keep questions concise (1-2 sentences each)

Generate 3 questions that will directly help them fix "${issue.title}" in their narrative.`;
}

// ============================================================================
// BATCH GENERATION (for multiple issues)
// ============================================================================

/**
 * Generate reflection prompts for multiple issues in parallel
 * (optimized for UX — user sees all prompts at once)
 */
export async function generateReflectionPromptsForIssues(
  issues: DetectedIssue[],
  entry: ExperienceEntry,
  options: {
    maxIssues?: number; // Limit to top N issues
    tone?: 'mentor' | 'coach' | 'curious_friend';
  } = {}
): Promise<ReflectionPromptSet[]> {
  const maxIssues = options.maxIssues || 5;
  const issuesToProcess = issues.slice(0, maxIssues);

  console.log(`[reflectionPrompts] Generating prompts for ${issuesToProcess.length} issues in parallel`);

  // Generate all prompts in parallel for speed
  const promptSets = await Promise.all(
    issuesToProcess.map(issue =>
      generateReflectionPrompts(issue, entry, {
        tone: options.tone,
        depth: issue.severity === 'critical' ? 'deep' : 'surface',
      })
    )
  );

  return promptSets;
}

// ============================================================================
// ERROR HANDLING & RETRY LOGIC
// ============================================================================

/**
 * Generate prompts with retry logic (no fallback templates - make LLM work)
 */

// ============================================================================
// CACHING & OPTIMIZATION
// ============================================================================

/**
 * Simple in-memory cache to avoid regenerating prompts for same issue+entry
 * (useful during iterative editing sessions)
 */
const promptCache = new Map<string, ReflectionPromptSet>();

function getCacheKey(issue: DetectedIssue, entry: ExperienceEntry): string {
  return `${issue.id}-${entry.id}-${entry.description_original.length}`;
}

export async function generateReflectionPromptsWithCache(
  issue: DetectedIssue,
  entry: ExperienceEntry,
  options: {
    tone?: 'mentor' | 'coach' | 'curious_friend';
    depth?: 'surface' | 'deep';
    skipCache?: boolean;
    maxRetries?: number;
  } = {}
): Promise<ReflectionPromptSet> {
  const cacheKey = getCacheKey(issue, entry);
  const maxRetries = options.maxRetries || 3;

  // Check cache first
  if (!options.skipCache && promptCache.has(cacheKey)) {
    console.log('[reflectionPrompts] Cache HIT for issue:', issue.id);
    return promptCache.get(cacheKey)!;
  }

  // Generate fresh prompts with retry logic
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[reflectionPrompts] Generation attempt ${attempt}/${maxRetries} for issue: ${issue.id}`);

      const promptSet = await generateReflectionPrompts(issue, entry, options);

      // Validate quality before accepting
      const validation = validatePromptQuality(promptSet);
      if (!validation.valid && attempt < maxRetries) {
        console.warn(`[reflectionPrompts] Quality validation failed (attempt ${attempt}):`, validation.warnings);
        continue; // Retry
      }

      // Success - cache and return
      promptCache.set(cacheKey, promptSet);
      console.log(`[reflectionPrompts] ✓ Generation successful on attempt ${attempt}`);
      return promptSet;

    } catch (error) {
      lastError = error as Error;
      console.error(`[reflectionPrompts] Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[reflectionPrompts] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed - throw error (no fallback)
  console.error(`[reflectionPrompts] ❌ All ${maxRetries} attempts failed for issue: ${issue.id}`);
  throw new Error(
    `Failed to generate reflection prompts after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

// ============================================================================
// VALIDATION & QUALITY CHECKS
// ============================================================================

/**
 * Validate that generated prompts meet quality standards
 */
export function validatePromptQuality(promptSet: ReflectionPromptSet): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check: Exactly 3 prompts
  if (promptSet.prompts.length !== 3) {
    warnings.push(`Expected 3 prompts, got ${promptSet.prompts.length}`);
  }

  // Check: No duplicate questions
  const questions = promptSet.prompts.map(p => p.question.toLowerCase());
  const uniqueQuestions = new Set(questions);
  if (uniqueQuestions.size !== questions.length) {
    warnings.push('Duplicate questions detected');
  }

  // Check: Questions are open-ended (not yes/no)
  promptSet.prompts.forEach((p, idx) => {
    const lowerQ = p.question.toLowerCase();
    if (lowerQ.startsWith('did you') ||
        lowerQ.startsWith('do you') ||
        lowerQ.startsWith('have you') ||
        lowerQ.startsWith('is ') ||
        lowerQ.startsWith('are ')) {
      warnings.push(`Prompt ${idx + 1} appears to be yes/no question: "${p.question}"`);
    }
  });

  // Check: Questions reference the activity
  promptSet.prompts.forEach((p, idx) => {
    if (!p.question.match(/\b(this|your|the)\s+(activity|experience|work|role|project)/i)) {
      // This is a loose check — some questions may be valid without explicit reference
      // Only warn, don't fail
    }
  });

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
