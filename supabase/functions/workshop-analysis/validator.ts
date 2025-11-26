/**
 * Suggestion Quality Validator
 *
 * Validates each workshop suggestion for:
 * - Authentic voice (not AI-generated feel)
 * - No banned clichés
 * - Specific, concrete language
 * - Educational rationale quality
 */

const VALIDATION_SYSTEM_PROMPT = `You are a Suggestion Text Quality Specialist for college essay editing.

**YOUR FOCUS:** Validate ONLY the suggestion text quality. Do NOT evaluate rationale - that's generated separately after the text is validated.

**CORE PRINCIPLE:**
The suggested writing should sound like a REAL STUDENT processed their own experience and wrote about it themselves.
It should be authentic to THEM - their insights, their character, their unique perspective.
Every word must EARN ITS PLACE in the 350-word budget by adding purposeful value.

**THE DUAL PRIORITY TEST:**
1. **Purposeful Contribution** (EQUAL priority to storytelling):
   - Does this add intellectual depth, character revelation, or meaningful insight?
   - Or is it just decoration/imagery without purpose?

2. **Storytelling Compelling** (EQUAL priority to purposeful contribution):
   - Does this use specific details, active voice, and authentic tone?
   - Or is it generic, abstract, or AI-generated?

**THE AUTHENTICITY TEST:**
Ask yourself: "Could this have ONLY been written by this specific person?"
- If yes → authentic
- If anyone could have written it → not authentic

**CRITICAL: AVOID AI CONVERGENCE**
AI models often converge on repetitive structures and patterns. Watch for:
- **Structural sameness**: All suggestions following identical sentence patterns
- **Opening formulas**: Always starting with dependent clauses, gerund phrases, or "As I..."
- **Closing patterns**: Always ending with realizations, sensory details, or em-dash insights
- **Rhythmic repetition**: Same pacing/cadence across all suggestions
- **Vocabulary convergence**: Reusing the same "literary" words (glint, faint, sharp, etc.)

**DIVERSITY REQUIREMENT**: Each suggestion should have:
- Different sentence structures (not all long/short, simple/complex)
- Varied opening strategies (action, dialogue, thought, description)
- Unique rhythm and pacing
- Fresh vocabulary choices
- Distinct narrative approaches

**WHAT MAKES SUGGESTION TEXT FEEL AI-GENERATED:**

1. **AI Clichés** - Banned terms that scream "AI wrote this":
   - tapestry, realm, testament, showcase, delve, underscore, journey (unless literal)
   - Flowery/grandiose words real teenagers don't use
   - "Holistic", "myriad", "plethora", "quintessential"

2. **Generic Insights** - Realizations anyone could have:
   - "I learned the value of hard work"
   - "I discovered how to persevere"
   - "This taught me about teamwork"
   - Ask: Is this insight SPECIFIC to this person's unique experience?

3. **Passive Voice** - Weakens student agency:
   - "was training" → "I trained"
   - "were doing" → "we did"
   - "was discovered" → "I discovered"
   - The student must be the active subject

4. **Summary Language** - Telling instead of showing:
   - "This taught me that..." → Show the realization through action
   - "I learned that..." → Demonstrate learning through change
   - "From this experience, I realized..." → Let insight emerge from details

5. **Missing Specificity:**
   - Vague nouns: "things", "stuff", "experiences"
   - Abstract concepts without concrete grounding
   - No sensory details or specific moments

6. **Over-Storytelling Without Purpose** (CRITICAL):
   - Excessive sensory details that don't reveal character or insight
   - Scene-setting without advancing narrative or showing growth
   - Flowery metaphors/similes that just decorate without adding meaning
   - Adjective chains that inflate word count without value ("the bright, vibrant, colorful...")
   - Description >50% of text (context-dependent - sometimes high description IS purposeful)

**WHAT MAKES SUGGESTION TEXT AUTHENTICALLY HUMAN:**

1. **Purposeful Contribution** - Every detail serves a function:
   - Reveals character trait, value, or growth
   - Advances the narrative arc
   - Provides intellectual depth or unique insight
   - Shows (not tells) a realization or change

2. **Storytelling Compelling** - Concrete, specific, and active:
   - Specific nouns, active verbs, sensory language (when purposeful)
   - Unique perspective - a way of seeing that's distinctly theirs
   - Active voice - student doing, not being done to
   - Earned insight - meaning shown through experience, not stated

3. **Word Efficiency** - Every word earns its place:
   - No filler or decoration for decoration's sake
   - Sensory details that reveal (not just describe)
   - Metaphors that illuminate (not just prettify)

4. **Structural Diversity** - Avoids AI convergence:
   - Varied sentence structures and openings
   - Fresh rhythm and pacing
   - Unique vocabulary choices
   - Different narrative approaches

5. **Natural Diction** - Words a real teenager would actually use

**BALANCED STORYTELLING:**
The best essays balance three elements equally:
- **Storytelling** (specific details, sensory language, scene)
- **Intellectual Depth** (analysis, connections, unique insights)
- **Character Revelation** (values, growth, personality)

If the suggestion is >50% pure description without revealing character or insight, FLAG IT as potentially over-storytelling (but consider context - sometimes high description IS the right choice for that moment).

**Quality Scoring (100 points total):**

**1. Purposeful Contribution (0-30 points) ← HIGHEST PRIORITY (equal to Storytelling)**
   - Adds unique insight/intellectual depth: 12 pts
   - Reveals character (values, perspective, growth): 10 pts
   - Advances narrative meaningfully: 8 pts

**2. Storytelling Compelling (0-30 points) ← EQUAL PRIORITY (equal to Purposeful Contribution)**
   - Specific and concrete (not abstract): 12 pts
   - Active voice (student as actor): 10 pts
   - Natural diction (words real teenagers use): 8 pts

**3. Authenticity (0-20 points)**
   - Real student voice (not AI-generated feel): 12 pts
   - Matches student's existing style/tone: 8 pts

**4. Originality/AI Convergence Avoidance (0-15 points)**
   - Structural diversity (not repetitive patterns): 6 pts
   - Fresh vocabulary (not overused "literary" words): 5 pts
   - Unique narrative approach: 4 pts

**5. Word Efficiency (0-5 points)**
   - Concise, no unnecessary words or decorative flourishes: 5 pts

**Final Scores:**
- **90-100**: Exceptional - Purposeful, compelling, authentic, original, efficient
- **70-89**: Good - Minor improvements, generally strong
- **50-69**: Needs work - Missing key dimensions or balance
- **< 50**: Critical - Decoration without purpose, AI feel, or convergence issues

**Output Format:**
{
  "isValid": boolean,
  "qualityScore": number (0-100),
  "scoreBreakdown": {
    "purposefulContribution": number (0-30), // HIGHEST PRIORITY (equal to storytelling)
    "storytellingCompelling": number (0-30), // EQUAL PRIORITY (equal to purposeful contribution)
    "authenticity": number (0-20),           // Real student voice, not AI-generated feel
    "originality": number (0-15),            // AI convergence avoidance, structural diversity
    "wordEfficiency": number (0-5)           // Conciseness, no decoration without purpose
  },
  "failures": [
    {
      "category": "ai_language" | "generic_insight" | "passive_voice" | "summary_language" | "missing_specificity" | "inauthenticity" | "over_storytelling" | "ai_convergence",
      "severity": "critical" | "warning",
      "message": "Clear explanation of the issue in the suggestion TEXT",
      "evidence": "The specific problematic text",
      "suggestion": "How to rewrite the TEXT to fix it"
    }
  ],
  "strengths": ["What feels genuinely human and purposeful about the suggestion TEXT"],
  "retryGuidance": "Specific instructions for improving the TEXT (if needed)",
  "efficiencyFlags": ["Notes about description saturation, word efficiency, or balance - informational only"]
}

**Remember:** You're ONLY validating the suggestion text. Rationale validation happens separately.`;

export interface ValidationResult {
  isValid: boolean;
  qualityScore: number;
  scoreBreakdown?: {
    purposefulContribution: number; // 0-30 points (HIGHEST - equal to storytelling)
    storytellingCompelling: number; // 0-30 points (EQUAL to purposeful contribution)
    authenticity: number;           // 0-20 points (real student voice, not AI feel)
    originality: number;            // 0-15 points (AI convergence avoidance, diversity)
    wordEfficiency: number;         // 0-5 points (conciseness)
  };
  failures: Array<{
    category: string;
    severity: 'critical' | 'warning';
    message: string;
    evidence: string;
    suggestion: string;
  }>;
  strengths: string[];
  retryGuidance: string;
  efficiencyFlags?: string[];
}

/**
 * Run fast deterministic checks (pre-filter)
 * ONLY checks suggestion text quality (not rationale)
 * Returns both failures AND efficiency flags (informational only - don't block)
 */
function runDeterministicChecks(
  suggestionText: string,
  originalText: string = ''
): {
  failures: Array<{
    category: string;
    severity: 'critical' | 'warning';
    message: string;
    evidence: string;
    suggestion: string;
  }>;
  efficiencyFlags: string[];
} {
  const failures: Array<{
    category: string;
    severity: 'critical' | 'warning';
    message: string;
    evidence: string;
    suggestion: string;
  }> = [];

  const efficiencyFlags: string[] = [];

  // Check 1: Passive voice patterns
  const passivePatterns = [
    /\bwas\s+\w+ing\b/i,      // "was training", "was working"
    /\bwere\s+\w+ing\b/i,     // "were doing"
    /\bwas\s+\w+ed\b/i,       // "was discovered"
    /\bwere\s+\w+ed\b/i,      // "were found"
    /\bit\s+was\s+\w+ed\b/i,  // "it was learned"
  ];

  for (const pattern of passivePatterns) {
    const match = suggestionText.match(pattern);
    if (match) {
      failures.push({
        category: 'passive_voice',
        severity: 'warning',
        message: 'Passive voice weakens agency - the student should be the actor',
        evidence: match[0],
        suggestion: 'Rewrite with the student as the active subject doing the action.'
      });
      break; // Only flag once
    }
  }

  // Check 2: "This taught me" / "I learned that" summary patterns
  const summaryPatterns = [
    /this\s+(taught|showed|helped)\s+me/i,
    /i\s+learned\s+that/i,
    /from\s+this[,]?\s+i\s+(realized|learned|understood)/i,
    /this\s+experience\s+(taught|showed)/i,
  ];

  for (const pattern of summaryPatterns) {
    const match = suggestionText.match(pattern);
    if (match) {
      failures.push({
        category: 'generic_insight',
        severity: 'warning',
        message: 'Summary language tells rather than shows - demonstrate the insight through action/detail instead',
        evidence: match[0],
        suggestion: 'Instead of stating what you learned, show the reader through specific moments or changed behavior.'
      });
      break;
    }
  }

  // === EFFICIENCY FLAGS (INFORMATIONAL ONLY - DON'T BLOCK) ===

  // Flag 1: Adjective chains (potential decoration without purpose)
  const adjChainMatch = suggestionText.match(/\b(\w+),\s+(\w+),\s+(and\s+)?(\w+)\s+(\w+)/gi);
  if (adjChainMatch) {
    efficiencyFlags.push(`Adjective chain detected: "${adjChainMatch[0]}" - Verify each adjective reveals character/insight, not just decoration`);
  }

  // Flag 2: Flowery metaphors/similes (potential word waste)
  const floweryPatterns = [
    { pattern: /like\s+(a|an)\s+\w+\s+(washing|crashing|flowing|blooming|rising|falling|sweeping)/i, type: 'flowery simile' },
    { pattern: /as\s+if\s+\w+\s+were/i, type: 'flowery comparison' }
  ];

  for (const { pattern, type } of floweryPatterns) {
    const match = suggestionText.match(pattern);
    if (match) {
      efficiencyFlags.push(`Potentially ${type}: "${match[0]}" - Verify this adds insight/character revelation, not just decoration`);
      break;
    }
  }

  // Flag 3: Long scene-setting without "I" (potential over-description)
  const sentences = suggestionText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longDescriptiveSentences = sentences.filter(s =>
    s.length > 100 &&
    !s.match(/\b(I|my|me|we|our)\b/i) &&
    s.split(/\s+/).length > 15
  );

  if (longDescriptiveSentences.length > 0) {
    const sample = longDescriptiveSentences[0].trim().substring(0, 60) + '...';
    efficiencyFlags.push(`Long scene-setting without student agency: "${sample}" - Verify this reveals character/advances narrative`);
  }

  // Flag 4: AI convergence - repetitive opening patterns
  const convergencePatterns = [
    { pattern: /^(As|When|While|After|Before)\s+I\s+/i, type: 'dependent clause opening' },
    { pattern: /^(Standing|Sitting|Walking|Running|Looking|Watching|Holding)\s+/i, type: 'gerund opening' },
    { pattern: /^The\s+(golden|bright|vibrant|faint|sharp|soft|dim)\s+/i, type: 'adjective+noun opening' }
  ];

  for (const { pattern, type } of convergencePatterns) {
    if (suggestionText.match(pattern)) {
      efficiencyFlags.push(`AI convergence risk: ${type} - Consider varied structural approaches to avoid pattern repetition`);
      break;
    }
  }

  // Flag 4b: Overused "literary" vocabulary that AI models converge on
  const overusedLiteraryWords = [
    'glint', 'faint', 'sharp', 'crisp', 'delicate', 'vibrant',
    'shimmer', 'gleam', 'cascade', 'weave', 'thread',
    'tapestry', 'realm', 'testament', 'showcase', 'delve', 'underscore'
  ];

  const foundOverused = overusedLiteraryWords.filter(word =>
    suggestionText.toLowerCase().includes(word)
  );

  if (foundOverused.length > 0) {
    efficiencyFlags.push(`Overused literary vocabulary detected: "${foundOverused.join(', ')}" - Consider more natural, student-appropriate word choices`);
  }

  // Flag 4c: Em-dash insights (AI pattern of ending with em-dash realization)
  if (suggestionText.match(/—[^—]+\.$/) || suggestionText.match(/--[^-]+\.$/)) {
    efficiencyFlags.push(`Em-dash insight ending detected - AI models often end with "—a realization" pattern. Consider varied closure strategies`);
  }

  // Flag 4d: Rhythmic repetition (same sentence length pattern)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  if (sentenceLengths.length >= 3) {
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const allSimilar = sentenceLengths.every(len => Math.abs(len - avgLength) < 3);

    if (allSimilar) {
      efficiencyFlags.push(`Rhythmic repetition: All sentences similar length (~${Math.round(avgLength)} words) - Vary sentence structure for authenticity`);
    }
  }

  // Flag 5: Description saturation (>50% pure description)
  const totalWords = suggestionText.split(/\s+/).length;

  // Count descriptive/sensory words vs action/thinking words
  const descriptiveWords = (suggestionText.match(/\b(golden|bright|soft|warm|cold|sharp|faint|dusty|vibrant|colorful|dim|dark|light)\b/gi) || []).length;
  const sensorySentences = sentences.filter(s =>
    s.match(/\b(saw|heard|felt|smelled|tasted|touched|noticed)\b/i) &&
    !s.match(/\b(realized|understood|learned|thought|knew|discovered)\b/i)
  ).length;

  const totalSentences = sentences.length;
  const descriptionRatio = sensorySentences / Math.max(totalSentences, 1);

  if (descriptionRatio > 0.5 && totalSentences >= 2) {
    efficiencyFlags.push(`Description saturation: ${Math.round(descriptionRatio * 100)}% of sentences are pure description - Verify balance with intellectual depth/character revelation (context-dependent)`);
  }

  return { failures, efficiencyFlags };
}

/**
 * Validate all 3 suggestions for an item in a SINGLE batch call
 * More efficient: 1 API call instead of 3 separate calls
 */
async function validateSuggestionsBatch(
  suggestions: any[],
  originalText: string,
  voiceTone: string,
  anthropicApiKey: string,
  attemptNumber: number = 1
): Promise<ValidationResult[]> {

  // Step 1: Run deterministic checks on all 3 suggestions
  const suggestionChecks = suggestions.map(sugg => ({
    text: sugg.text,
    type: sugg.type,
    checks: runDeterministicChecks(sugg.text, originalText)
  }));

  // Build batch validation prompt for all 3 suggestions
  const suggestionsContext = suggestionChecks.map((sc, idx) => {
    const efficiencyContext = sc.checks.efficiencyFlags.length > 0
      ? `\n   **Efficiency Flags:** ${sc.checks.efficiencyFlags.map(f => `\n      - ${f}`).join('')}`
      : '';

    return `### Suggestion ${idx + 1}: ${sc.type}
   **Text:** "${sc.text}"${efficiencyContext}`;
  }).join('\n\n');

  const validationPrompt = `# BATCH VALIDATION: All 3 Suggestions for Same Issue

## Original Text (from essay):
"${originalText}"

## Context:
- **Student Voice Tone:** ${voiceTone}
- **Attempt Number:** ${attemptNumber}

## 3 Suggestions to Validate:

${suggestionsContext}

---

**Task:** Validate ALL 3 suggestion texts in one response. For EACH suggestion, evaluate quality across 5 dimensions.

**Focus Areas (5-Dimensional Scoring - Comprehensive Quality Assessment):**

**1. Purposeful Contribution (0-30 points) ← HIGHEST PRIORITY (equal to Storytelling):**
   - Does it add intellectual depth or unique insight? (12 pts)
   - Does it reveal character/values/growth? (10 pts)
   - Does it advance narrative meaningfully? (8 pts)

**2. Storytelling Compelling (0-30 points) ← EQUAL PRIORITY (equal to Purposeful Contribution):**
   - Specific and concrete (not abstract)? (12 pts)
   - Active voice (student as actor)? (10 pts)
   - Natural diction (words real teenagers use)? (8 pts)

**3. Authenticity (0-20 points):**
   - Real student voice (not AI-generated feel)? (12 pts)
   - Matches student's existing style/tone? (8 pts)
   - No clichés (tapestry, realm, testament, etc.)?
   - No summary language ("This taught me...")?

**4. Originality/AI Convergence Avoidance (0-15 points):**
   - Structural diversity (not repetitive patterns, varied openings)? (6 pts)
   - Fresh vocabulary (not overused "literary" words like glint, faint, shimmer)? (5 pts)
   - Unique narrative approach? (4 pts)

**5. Word Efficiency (0-5 points):**
   - Concise (no unnecessary words)? (3 pts)
   - No decorative flourishes without purpose? (2 pts)
   - Every word earns its place in 350-word budget?

**Scoring:**
- 90-100: Exceptional - Purposeful, compelling, authentic, original, efficient
- 70-89: Good quality, minor improvements
- 50-69: Needs work - missing key dimensions or balance
- < 50: Critical issues - decoration without purpose, AI feel, or convergence

**Return:** JSON array with 3 validation results (one per suggestion):
\`\`\`json
{
  "validations": [
    {
      "suggestionType": "polished_original",
      "isValid": boolean,
      "qualityScore": number,
      "scoreBreakdown": { ... },
      "failures": [ ... ],
      "strengths": [ ... ],
      "retryGuidance": "...",
      "efficiencyFlags": [ ... ]
    },
    // ... 2 more
  ]
}
\`\`\``;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000, // Larger for 3 validations
        temperature: 0.1,
        system: VALIDATION_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: validationPrompt
        }]
      })
    });

    if (!response.ok) {
      console.warn('⚠️ Batch validation API call failed, assuming valid');
      return suggestions.map(() => ({
        isValid: true,
        qualityScore: 70,
        failures: [],
        strengths: ['Validation failed - assuming acceptable'],
        retryGuidance: ''
      }));
    }

    const result = await response.json();
    const content = result.content[0].text;

    // Parse JSON from response
    let validationData;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      validationData = JSON.parse(jsonString);
    } catch (e) {
      console.warn('⚠️ Failed to parse batch validation JSON, assuming valid');
      return suggestions.map(() => ({
        isValid: true,
        qualityScore: 70,
        failures: [],
        strengths: ['Parse error - assuming acceptable'],
        retryGuidance: ''
      }));
    }

    // Return array of 3 validation results
    const validations = validationData.validations || [];
    return validations.map((v: any) => ({
      isValid: v.isValid ?? true,
      qualityScore: v.qualityScore ?? 70,
      scoreBreakdown: v.scoreBreakdown,
      failures: v.failures ?? [],
      strengths: v.strengths ?? [],
      retryGuidance: v.retryGuidance ?? '',
      efficiencyFlags: v.efficiencyFlags ?? []
    }));

  } catch (error) {
    console.error('❌ Batch validation error:', error);
    return suggestions.map(() => ({
      isValid: true,
      qualityScore: 60,
      failures: [],
      strengths: ['Validation error - assuming acceptable'],
      retryGuidance: ''
    }));
  }
}

/**
 * DEPRECATED: Use validateSuggestionsBatch instead
 * Kept for backward compatibility
 */
export async function validateSuggestion(
  suggestionText: string,
  originalText: string,
  voiceTone: string,
  anthropicApiKey: string,
  attemptNumber: number = 1
): Promise<ValidationResult> {

  // Step 1: Run instant deterministic checks first (only on suggestion text)
  const { failures: deterministicFailures, efficiencyFlags } = runDeterministicChecks(suggestionText, originalText);

  // If we have critical issues from deterministic checks, fail fast
  const hasCriticalFailures = deterministicFailures.some(f => f.severity === 'critical');
  if (hasCriticalFailures) {
    console.log(`      ⚡ Fast fail: ${deterministicFailures.length} deterministic issues`);
    return {
      isValid: false,
      qualityScore: 50,
      failures: deterministicFailures,
      strengths: [],
      retryGuidance: deterministicFailures.map(f => f.suggestion).join(' ')
    };
  }

  // Step 2: Run LLM validation for nuanced quality checks (ONLY suggestion text)
  // Include efficiency flags as informational context
  const efficiencyContext = efficiencyFlags.length > 0
    ? `\n\n## Efficiency Flags (from deterministic checks):\n${efficiencyFlags.map(f => `- ${f}`).join('\n')}\n\n**Note:** These are informational flags to help you assess purposeful contribution and word efficiency. Consider them in your validation, but they are not automatic failures.`
    : '';

  const validationPrompt = `# SUGGESTION TEXT VALIDATION

## Suggested Text to Validate:
"${suggestionText}"

## Original Text (for comparison):
"${originalText}"

## Context:
- **Student Voice Tone:** ${voiceTone}
- **Attempt Number:** ${attemptNumber}${efficiencyContext}

---

**Task:** Validate ONLY the suggestion text quality. Do NOT evaluate rationale (that comes later).

**Focus Areas (5-Dimensional Scoring - Comprehensive Quality Assessment):**

**1. Purposeful Contribution (0-30 points) ← HIGHEST PRIORITY (equal to Storytelling):**
   - Does it add intellectual depth or unique insight? (12 pts)
   - Does it reveal character/values/growth? (10 pts)
   - Does it advance narrative meaningfully? (8 pts)

**2. Storytelling Compelling (0-30 points) ← EQUAL PRIORITY (equal to Purposeful Contribution):**
   - Specific and concrete (not abstract)? (12 pts)
   - Active voice (student as actor)? (10 pts)
   - Natural diction (words real teenagers use)? (8 pts)

**3. Authenticity (0-20 points):**
   - Real student voice (not AI-generated feel)? (12 pts)
   - Matches student's existing style/tone? (8 pts)
   - No clichés (tapestry, realm, testament, etc.)?
   - No summary language ("This taught me...")?

**4. Originality/AI Convergence Avoidance (0-15 points):**
   - Structural diversity (not repetitive patterns, varied openings)? (6 pts)
   - Fresh vocabulary (not overused "literary" words like glint, faint, shimmer)? (5 pts)
   - Unique narrative approach? (4 pts)

**5. Word Efficiency (0-5 points):**
   - Concise (no unnecessary words)? (3 pts)
   - No decorative flourishes without purpose? (2 pts)
   - Every word earns its place in 350-word budget?

**Scoring:**
- 90-100: Exceptional - Purposeful, compelling, authentic, original, efficient
- 70-89: Good quality, minor improvements
- 50-69: Needs work - missing key dimensions or balance
- < 50: Critical issues - decoration without purpose, AI feel, or convergence

**Return:** JSON with validation result including scoreBreakdown and efficiencyFlags.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        temperature: 0.1, // Low temp for consistent validation
        system: VALIDATION_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: validationPrompt
        }]
      })
    });

    if (!response.ok) {
      console.warn('⚠️ Validation API call failed, assuming valid');
      return {
        isValid: true,
        qualityScore: 70,
        failures: [],
        strengths: ['Validation failed - assuming acceptable'],
        retryGuidance: ''
      };
    }

    const result = await response.json();
    const content = result.content[0].text;

    // Parse JSON from response
    let validationData;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      validationData = JSON.parse(jsonString);
    } catch (e) {
      console.warn('⚠️ Failed to parse validation JSON, assuming valid');
      return {
        isValid: true,
        qualityScore: 70,
        failures: [],
        strengths: ['Parse error - assuming acceptable'],
        retryGuidance: ''
      };
    }

    return {
      isValid: validationData.isValid ?? true,
      qualityScore: validationData.qualityScore ?? 70,
      scoreBreakdown: validationData.scoreBreakdown,
      failures: validationData.failures ?? [],
      strengths: validationData.strengths ?? [],
      retryGuidance: validationData.retryGuidance ?? '',
      efficiencyFlags: validationData.efficiencyFlags ?? efficiencyFlags
    };

  } catch (error) {
    console.error('❌ Validation error:', error);
    // Fail open - don't block on validation errors
    return {
      isValid: true,
      qualityScore: 60,
      failures: [],
      strengths: ['Validation error - assuming acceptable'],
      retryGuidance: ''
    };
  }
}

/**
 * Generate a batch of workshop items (4 items)
 * This is the GENERATION step only - validation happens separately
 */
export async function generateWorkshopBatch(
  essayText: string,
  promptText: string,
  rubricAnalysis: any,
  voiceFingerprint: any,
  anthropicApiKey: string,
  baseSystemPrompt: string,
  batchNumber: number
): Promise<any[]> {

  console.log(`   🔄 Generating batch ${batchNumber} (4 items)...`);

  // Generate 4 items in one call for efficiency
  const userPrompt = `Identify the 4 most critical workshop items for this essay:\n\nPrompt: ${promptText}\n\nEssay:\n${essayText}\n\nRubric Analysis:\n${JSON.stringify(rubricAnalysis, null, 2)}\n\n**CRITICAL REQUIREMENTS:**\n- Return EXACTLY 4 distinct workshop items\n- Each item must have 3 suggestions (polished_original, voice_amplifier, divergent_strategy)\n- Focus on the most impactful improvements\n- Ensure each suggestion preserves the student's authentic voice`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000, // More tokens for 4 items
      temperature: 0.8,
      system: baseSystemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    console.error(`   ❌ Batch ${batchNumber} generation failed`);
    return [];
  }

  const result = await response.json();
  const content = result.content[0].text;

  // Parse workshop items
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
    const parsed = JSON.parse(jsonString);
    const items = parsed.workshopItems || [];

    console.log(`   ✅ Batch ${batchNumber}: Generated ${items.length} items`);
    return items;
  } catch (e) {
    console.error(`   ❌ Failed to parse batch ${batchNumber}`);
    return [];
  }
}

/**
 * Validate all 3 suggestions for a workshop item with retry logic
 * Matches the flow from surgicalEditor_v2.ts:
 * 1. Generate 3 suggestions
 * 2. Validate all 3
 * 3. If < 3 valid → Retry generation with feedback (up to 2 attempts total)
 */
export async function validateWorkshopItemSuggestions(
  workshopItem: any,
  voiceFingerprint: any,
  anthropicApiKey: string,
  baseSystemPrompt: string,
  essayText: string,
  maxAttempts: number = 2
): Promise<any[]> {
  let validatedSuggestions: any[] = [];
  let attemptNumber = 1;
  let lastRetryGuidance = '';

  while (attemptNumber <= maxAttempts) {
    const currentSuggestions = attemptNumber === 1
      ? workshopItem.suggestions
      : await regenerateItemSuggestions(
          workshopItem,
          voiceFingerprint,
          anthropicApiKey,
          baseSystemPrompt,
          essayText,
          lastRetryGuidance
        );

    if (!currentSuggestions || currentSuggestions.length === 0) {
      console.log(`      ⚠️ No suggestions generated on attempt ${attemptNumber}`);
      attemptNumber++;
      continue;
    }

    // Validate all 3 suggestion TEXTS in a single batch call (more efficient!)
    console.log(`      🔍 Batch validating 3 suggestions...`);

    const validationResults = await validateSuggestionsBatch(
      currentSuggestions,
      workshopItem.quote || '',
      voiceFingerprint?.tone?.primary || 'authentic',
      anthropicApiKey,
      attemptNumber
    );

    // Process validation results
    validationResults.forEach((validation, idx) => {
      const suggestion = currentSuggestions[idx];

      if (validation.isValid && validation.qualityScore >= 70) {
        console.log(`      ✅ Suggestion ${idx + 1} validated (score: ${validation.qualityScore})`);
        validatedSuggestions.push(suggestion);
      } else {
        console.log(`      ⚠️ Suggestion ${idx + 1} failed (score: ${validation.qualityScore})`);
        // Collect retry guidance from failed validations
        if (validation.retryGuidance) {
          lastRetryGuidance = validation.retryGuidance;
        }
      }
    });

    // If we have at least 3 valid suggestions, we're done
    if (validatedSuggestions.length >= 3) {
      break;
    }

    // If not all passed and we have attempts left, retry
    if (attemptNumber < maxAttempts) {
      console.log(`      🔄 Only ${validatedSuggestions.length}/3 suggestions valid. Retrying with feedback...`);
      validatedSuggestions = []; // Reset for next attempt
    }

    attemptNumber++;
  }

  return validatedSuggestions.slice(0, 3); // Return at most 3
}

/**
 * Regenerate all 3 suggestions for a workshop item with validation feedback
 */
async function regenerateItemSuggestions(
  workshopItem: any,
  voiceFingerprint: any,
  anthropicApiKey: string,
  baseSystemPrompt: string,
  essayText: string,
  retryGuidance: string
): Promise<any[]> {
  const retryPrompt = `**VALIDATION FEEDBACK FROM PREVIOUS ATTEMPT:**
${retryGuidance}

---

**Original Text:** "${workshopItem.quote}"

**Essay Context:**
${essayText.substring(0, 500)}...

**Student Voice:** ${voiceFingerprint?.tone?.primary || 'authentic'}

**Task:** Regenerate ALL 3 suggestions for this workshop item, fixing the issues mentioned above.

Return JSON with 3 suggestions:
{
  "suggestions": [
    {
      "type": "polished_original",
      "text": "...",
      "rationale": "..."
    },
    {
      "type": "voice_amplifier",
      "text": "...",
      "rationale": "..."
    },
    {
      "type": "divergent_strategy",
      "text": "...",
      "rationale": "..."
    }
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        system: baseSystemPrompt,
        messages: [{ role: 'user', content: retryPrompt }]
      })
    });

    if (!response.ok) {
      console.error('      ❌ Retry generation failed');
      return [];
    }

    const result = await response.json();
    const content = result.content[0].text;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
    const parsed = JSON.parse(jsonString);

    return parsed.suggestions || [];
  } catch (error) {
    console.error('      ❌ Retry parsing failed:', error);
    return [];
  }
}
