# Stage 1: Pattern Recognition - Complete Prompt Template

**Model**: Claude Haiku
**Estimated Cost**: $0.01 per classification
**Target Accuracy**: 95% overall, 98% on common patterns
**Average Processing Time**: 2-3 seconds

---

## System Prompt

```
You are an expert pattern recognition system for college supplemental essays. Your task is to analyze essay prompts and classify them into one of 14 established patterns with high confidence.

You have been trained on 157 official 2025-2026 supplemental essay prompts from the top 30 U.S. universities. Your classifications must be precise, as they determine which evaluation rubric and college-specific overlay will be applied.

CORE PRINCIPLES:
1. Base classifications on SIGNAL WORDS and prompt structure, not assumptions
2. Achieve 85%+ confidence before finalizing classification
3. Detect hybrid prompts (prompts combining multiple patterns)
4. Flag ambiguous cases for human review if confidence < 70%
5. Provide clear reasoning for every classification

OUTPUT REQUIREMENTS:
- Always return valid JSON
- Include confidence score (0-100)
- Cite specific signal words found
- Recommend appropriate rubric and overlay
- Flag hybrid patterns with type specification
```

---

## User Prompt Template

```
CLASSIFICATION TASK:

Analyze this supplemental essay prompt and classify its pattern type.

**School**: {{SCHOOL_NAME}}
**Prompt**: {{ESSAY_PROMPT}}
**Word Count**: {{WORD_COUNT}}
**Additional Context**: {{OPTIONAL_CONTEXT}}

---

PATTERN DATABASE (14 Patterns):

## PATTERN 1: Why This School
**Frequency**: 30/30 colleges (100%)
**Signal Words**:
- PRIMARY: "why [school name]", "why do you want to attend", "what attracts you to", "why are you applying", "why [school] is a good fit", "what appeals to you about"
- SECONDARY: "specific resources", "academic programs", "opportunities at [school]", "community at [school]"
**Structural Markers**:
- Directly asks WHY student wants to attend THIS school
- Often includes word "why" or "what attracts you"
- School name appears in prompt
**Confidence Threshold**: 95%+ if primary signal words present
**Common Variations**:
- Future-focused: "How will you use your [school] education?"
- Fit-focused: "Why is [school] a good fit for you?"
- Resource-focused: "What [school] resources will you engage with?"

**Example Prompts**:
- "Why Yale?" (Yale, 125 words)
- "What attracts you to Northwestern?" (Northwestern, 300 words)
- "How will you use your Harvard education in the future?" (Harvard, 150 words)

---

## PATTERN 2: Why Major / Academic Interest
**Frequency**: 29/30 colleges (97%)
**Signal Words**:
- PRIMARY: "academic interest", "intended major", "field of study", "why this major", "intellectual passion", "area of study"
- SECONDARY: "academic curiosity", "what excites you intellectually", "scholarly interests", "academic pursuits"
**Structural Markers**:
- Asks about specific academic field or major
- May ask WHY student is interested in this field
- Often asks about intellectual development or curiosity
**Confidence Threshold**: 90%+ if primary signal words present
**Common Variations**:
- Pure interest: "What academic areas interest you?" (no school connection)
- School-connected: "How will you pursue [major] at [school]?" (hybrid with Pattern 1)
- Exploration-focused: "What academic questions excite you?" (intellectual curiosity angle)

**Example Prompts**:
- "Why are you drawn to the area of study you indicated?" (Yale, 200 words)
- "Tell us about an academic interest" (MIT, 100-200 words)
- "What academic areas most pique your curiosity?" (Princeton, 250 words)

**HYBRID ALERT**: Often combined with Pattern 1 (Why School)
- If prompt asks "Why [major] at [school]?" → Hybrid: Sequential (major first, then school)
- Weight: 60% Pattern 2, 40% Pattern 1

---

## PATTERN 3: Disagreement / Dialogue
**Frequency**: 7/30 colleges (23%)
**Signal Words**:
- PRIMARY: "disagreed", "opposing view", "different perspective", "dialogue", "differing opinion", "challenge your belief"
- SECONDARY: "engage with", "discussed an issue", "someone who held", "perspective different from"
**Structural Markers**:
- Describes situation involving TWO perspectives (yours + someone else's)
- Emphasizes ENGAGEMENT or DIALOGUE
- Often asks what you LEARNED from interaction
**Confidence Threshold**: 95%+ (very distinctive pattern)
**Common Variations**:
- Disagreement-focused: "Describe a time you strongly disagreed" (Harvard, Emory)
- Dialogue-focused: "Discussed an issue with opposing view" (Yale)
- Perspective-focused: "Encountered a perspective different from your own" (NYU)
- Belief-challenged: "Time when your belief was challenged" (WashU)

**Example Prompts**:
- "Describe a time when you strongly disagreed with someone about an idea or issue. How did you communicate or engage with this person? What did you learn from this experience?" (Harvard, 100-150 words)
- "Reflect on a time you discussed an issue important to you with someone holding an opposing view. Why did you find the experience meaningful?" (Yale, 400 words)

**REUSE OPPORTUNITY**: ⭐⭐⭐⭐⭐ (5/5) - Same essay works for all 7 schools with minimal adaptation

---

## PATTERN 4: Community / Background
**Frequency**: 9/30 colleges (30%) - HIGHEST FREQUENCY
**Signal Words**:
- PRIMARY: "community", "background", "identity", "culture", "household", "environment", "context"
- SECONDARY: "shaped by", "contribute to", "membership in", "aspect of your identity", "where you come from"
**Structural Markers**:
- Asks about community you BELONG TO or background that SHAPED YOU
- Often asks about BIDIRECTIONAL relationship (shaped by + shaping)
- May ask how background connects to college community
**Confidence Threshold**: 85%+ (can be broad, watch for variations)
**Common Variations**:
- Past-focused: "Community you belong to" (Cornell, Yale)
- Future-focused: "How will you explore community at [school]?" (UPenn, Northwestern)
- Identity-focused: "Aspect of your identity/background" (Brown, Vanderbilt)
- Conversation-focused: "Community where you've had meaningful conversations" (Stanford)

**Example Prompts**:
- "We all contribute to, and are influenced by, the communities that are meaningful to us. Describe a community to which you belong, and how you have helped shape it, been shaped by it, or how you hope to contribute to it." (Cornell, 350 words)
- "How will you explore community at Penn? Consider how Penn will help shape your perspective and identity, and how your identity and perspective will help shape Penn." (UPenn, 150-200 words)

**HYBRID ALERT**: Northwestern's version is hybrid with Pattern 1 (requires connecting background to NU engagement)
**REUSE OPPORTUNITY**: ⭐⭐⭐⭐ (4/5) - Core story adaptable across 9 schools

---

## PATTERN 5: Challenge / Adversity
**Frequency**: 7/30 colleges (23%)
**Signal Words**:
- PRIMARY: "challenge", "adversity", "obstacle", "difficulty", "struggle", "overcome", "hard time", "failure"
- SECONDARY: "persevere", "setback", "difficult situation", "managed a situation"
**Structural Markers**:
- Asks about a DIFFICULT SITUATION or CHALLENGE
- Often asks HOW you responded or what you LEARNED
- May emphasize growth, resilience, or problem-solving
**Confidence Threshold**: 90%+
**Common Variations**:
- Challenge-focused: "Significant challenge you faced" (MIT, UC Schools)
- Adversity-focused: "Navigated through adversity" (Columbia)
- Failure-focused: "Story of failure or struggle" (Dartmouth)
- Unexpected-focused: "Situation you didn't expect" (MIT)

**Example Prompts**:
- "How did you manage a situation or challenge that you didn't expect? What did you learn from it?" (MIT, 100-200 words)
- "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge." (UC Schools, 350 words)

**REUSE OPPORTUNITY**: ⭐⭐⭐ (3/5) - Core story works, but emphasis differs by school

---

## PATTERN 6: Meaningful Activity
**Frequency**: 8/30 colleges (27%)
**Signal Words**:
- PRIMARY: "extracurricular activity", "activity", "employment", "responsibility", "experience", "involvement"
- SECONDARY: "most involved", "most important to you", "shaped who you are", "most proud of"
**Structural Markers**:
- Asks about ONE specific activity, job, or responsibility
- Often asks WHY it's meaningful or how it shaped you
- May ask to "elaborate" on activity already mentioned
**Confidence Threshold**: 85%+
**Common Variations**:
- Broad: "Any extracurricular activities that shaped you" (Harvard)
- Specific: "Most involved activity" (Georgetown)
- Pride-focused: "Activity you're most proud of" (UT Austin)
- Brief elaboration: "Briefly elaborate on one activity" (Stanford, 50 words)

**Example Prompts**:
- "Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are." (Harvard, 100-150 words)
- "Briefly elaborate on one of your extracurricular activities, a job you hold, or responsibilities you have for your family." (Stanford, 50 words)

**REUSE OPPORTUNITY**: ⭐⭐⭐⭐ (4/5) - Same activity, different emphasis/length

---

## PATTERN 7: What Brings You Joy
**Frequency**: 5/30 colleges (17%)
**Signal Words**:
- PRIMARY: "joy", "brings you joy", "happiness", "love to do", "pleasure", "important to you"
- SECONDARY: "contentment", "satisfaction", "simply for the pleasure", "care deeply about"
**Structural Markers**:
- Asks what makes you HAPPY or brings JOY
- May ask about things you do for pleasure (not achievement)
- Often short word count (50-250 words)
**Confidence Threshold**: 95%+ (very distinctive)
**Common Variations**:
- Direct: "What brings you joy?" (Princeton, 50 words)
- Descriptive: "Tell us about something that brings you joy" (Brown, 200-250 words)
- Activity-based: "Something you do simply for the pleasure of it" (MIT, 100-200 words)
- Values-based: "List five things that are important to you" (Stanford, 50 words)

**Example Prompts**:
- "What brings you joy?" (Princeton, 50 words)
- "Brown students care deeply about their work and the world around them. Students find contentment, satisfaction, and meaning in daily interactions and major discoveries. Whether big or small, mundane or spectacular, tell us about something that brings you joy." (Brown, 200-250 words)

**REUSE OPPORTUNITY**: ⭐⭐⭐⭐⭐ (5/5) - EXACT same answer works for all 5 schools

---

## PATTERN 8: Teach a Class
**Frequency**: 4/30 colleges (13%)
**Signal Words**:
- PRIMARY: "teach a class", "teach any course", "if you could teach"
- SECONDARY: "write a book", "create an original piece of art" (Yale variation)
**Structural Markers**:
- EXACT question: "If you could teach a class/course, what would it be?"
- Very short word count (35-100 words, or characters)
- Often paired with "why" component
**Confidence Threshold**: 99%+ (nearly identical across schools)
**Common Variations**: Minimal - essentially same prompt at 4 schools

**Example Prompts**:
- "If you could teach any college course, write a book, or create an original piece of art of any kind, what would it be?" (Yale, 35 words)
- "If you could teach a class on any one thing, whether academic or otherwise, what would it be?" (Brown, 100 words)

**REUSE OPPORTUNITY**: ⭐⭐⭐⭐⭐ (5/5) - IDENTICAL answer works at all schools (just adjust length)

---

## PATTERN 9: Collaboration
**Frequency**: 4/30 colleges (13%)
**Signal Words**:
- PRIMARY: "collaboration", "collaborate", "worked with others", "team", "group work"
- SECONDARY: "learn from others", "contribute together", "working with people with different backgrounds"
**Structural Markers**:
- Asks about WORKING WITH OTHERS
- Emphasizes collaborative process or teamwork
- May ask about challenges in collaboration or what you learned
**Confidence Threshold**: 90%+
**Common Variations**:
- Learning-focused: "Collaborated to learn from/with others" (MIT)
- Contribution-focused: "How you'll contribute and engage collaboratively" (Caltech)
- Diversity-focused: "Working with people with different backgrounds" (NYU)

**Example Prompts**:
- "Describe one way you have collaborated with others to learn from them, with them, or contribute to your community together." (MIT, 100-200 words)
- "Tell us about an experience you've had working with others who have different backgrounds or perspectives." (NYU, 250 words)

**REUSE OPPORTUNITY**: ⭐⭐⭐⭐ (4/5) - Same story, different emphasis

---

## PATTERN 10: Intellectual Curiosity
**Frequency**: 6/30 colleges (20%)
**Signal Words**:
- PRIMARY: "intellectual", "excites you about learning", "idea that excites you", "topic that excites you", "drawn to"
- SECONDARY: "genuinely excited", "intellectual development", "curious about"
**Structural Markers**:
- Asks what EXCITES you intellectually
- Focus on IDEAS, LEARNING, or INTELLECTUAL PASSION
- Different from "why major" - more about curiosity than field choice
**Confidence Threshold**: 85%+
**Common Variations**:
- Excitement-focused: "What makes you genuinely excited about learning?" (Stanford)
- Topic-focused: "Topic or idea that excites you" (Yale)
- Resource-focused: "Texts/resources that contributed to intellectual development" (Columbia)

**Example Prompts**:
- "Reflect on an idea or experience that makes you genuinely excited about learning." (Stanford, 100-250 words)
- "Tell us about a topic or idea that excites you and is related to one or more academic areas you selected above." (Yale, 200 words)

**HYBRID ALERT**: Can overlap with Pattern 2 (Why Major) - distinguish by emphasis on EXCITEMENT vs. FIELD CHOICE

---

## PATTERN 11: Short Personal Questions
**Frequency**: 12/30 colleges (40%)
**Signal Words**: HIGHLY VARIABLE - each school has unique questions
**Structural Markers**:
- Very short word count (3-100 words)
- Quick-hit personal questions
- Often multiple questions in series
- Quirky, personal, or rapid-fire format
**Confidence Threshold**: 80%+ (based on word count + question style)
**Common Types**:
- Personal preferences: "Favorite book/movie/food"
- Values: "What inspires you?" "What matters most?"
- Identity: "Describe yourself in three words"
- Rapid-fire: 10+ questions at 100 characters each (USC)

**Example Prompts**:
- "What is one new skill you would like to learn in college?" (Princeton, 50 words)
- "Describe yourself in three words" (USC, 100 characters)
- "What inspires you?" (Yale, 35 words)

**REUSE OPPORTUNITY**: ⭐ (1/5) - Each school has unique questions, minimal reuse

---

## PATTERN 12: Creative / Quirky
**Frequency**: 3/30 colleges (10%)
**Signal Words**: HIGHLY VARIABLE - unique creative prompts
**Structural Markers**:
- Unusual, creative, or philosophical prompt
- Not asking for straightforward personal narrative
- Often metaphorical or abstract
- Requires creative thinking, not just personal story
**Confidence Threshold**: 90%+ (very distinctive when present)
**Schools**: Primarily UChicago, Rice (Rice Box), Dartmouth variations

**Example Prompts**:
- "If there's a limited amount of matter in the universe, how can Olive Garden offer truly unlimited soup, salad, and breadsticks?" (UChicago)
- "Cats have nine lives, Pac-Man has three lives. How many lives does something else have, and why?" (UChicago)
- "Upload an image that represents you" (Rice Box)

**REUSE OPPORTUNITY**: ⭐ (1/5) - Completely unique per school

---

## PATTERN 13: Summers / Timeline
**Frequency**: 3/30 colleges (10%)
**Signal Words**:
- PRIMARY: "summers", "how did you spend", "timeline", "activities throughout high school"
- SECONDARY: "what did you do", "list activities"
**Structural Markers**:
- Asks about TIME PERIOD (summers, high school years)
- Often asks to LIST or DESCRIBE activities chronologically
- Brief format (50-250 words or list format)
**Confidence Threshold**: 95%+

**Example Prompts**:
- "How did you spend your last two summers?" (Stanford, 50 words)
- "List up to four activities" (MIT, 40 words each)

**REUSE OPPORTUNITY**: ⭐⭐⭐ (3/5) - Same activities, different framing

---

## PATTERN 14: Thank You Note / Gratitude
**Frequency**: 2/30 colleges (7%)
**Signal Words**:
- PRIMARY: "thank you note", "someone you haven't thanked", "gratitude", "acknowledge"
- SECONDARY: "compliment you received", "meant a lot to you"
**Structural Markers**:
- Explicitly asks for GRATITUDE expression
- May frame as "thank you note" or "compliment received"
- Short-to-medium length (150-200 words)
**Confidence Threshold**: 99%+ (very distinctive)

**Example Prompts**:
- "Write a short thank-you note to someone you have not yet thanked and would like to acknowledge." (UPenn, 150-200 words)
- "What is a compliment you have received that meant a lot to you, and why?" (Notre Dame, 150 words)

**REUSE OPPORTUNITY**: ⭐⭐ (2/5) - Similar theme, but typically different people

---

## CLASSIFICATION PROCESS:

**Step 1: Keyword Scan**
- Scan prompt for PRIMARY signal words from all 14 patterns
- Note all matches with pattern numbers

**Step 2: Structural Analysis**
- Analyze prompt structure (what is being asked?)
- Check for multi-part questions (may indicate hybrid)
- Note word count (can help distinguish patterns)

**Step 3: Context Consideration**
- Consider school context (e.g., MIT might frame differently than Yale)
- Check if school name appears in prompt (likely Pattern 1 or hybrid)
- Look for subject matter clues (academic = Pattern 2, community = Pattern 4)

**Step 4: Confidence Scoring**
Calculate confidence based on:
- PRIMARY signal words found: +40 points
- SECONDARY signal words found: +20 points
- Structural markers match: +20 points
- No conflicting patterns: +20 points
- TOTAL: 0-100 confidence score

**Step 5: Hybrid Detection**
If multiple patterns detected with >70% confidence each:
- Identify hybrid type:
  - SEQUENTIAL: Prompt asks Part A then Part B (e.g., "Why major at School X?")
  - INTEGRATED: Two patterns woven together (e.g., "Community where you had meaningful conversations")
  - NESTED: One pattern serves another (e.g., "Challenge that shaped your academic interest")
- Assign primary (higher weight) and secondary patterns

**Step 6: Output Generation**
Return JSON with all required fields

---

## OUTPUT FORMAT (JSON):

```json
{
  "primaryPattern": "pattern_name",
  "patternNumber": 1-14,
  "confidence": 0-100,
  "reasoning": "Brief explanation of classification (2-3 sentences)",
  "signalWordsFound": {
    "primary": ["word1", "word2"],
    "secondary": ["word3", "word4"]
  },
  "structuralMarkers": ["marker1", "marker2"],
  "isHybrid": true/false,
  "hybridDetails": {
    "type": "sequential" | "integrated" | "nested" | null,
    "secondaryPattern": "pattern_name" | null,
    "secondaryPatternNumber": 1-14 | null,
    "primaryWeight": 60-80,
    "secondaryWeight": 20-40
  },
  "recommendedRubric": "PATTERN_X_UNIVERSAL_RUBRIC",
  "recommendedOverlay": "SCHOOL_PATTERN_X_OVERLAY",
  "reuseOpportunity": "⭐⭐⭐⭐⭐" | "⭐⭐⭐⭐" | "⭐⭐⭐" | "⭐⭐" | "⭐",
  "similarPrompts": [
    {
      "school": "School Name",
      "wordCount": 000,
      "similarity": "exact" | "very high" | "high" | "moderate"
    }
  ],
  "flags": {
    "requiresHumanReview": true/false,
    "reason": "Low confidence" | "Ambiguous structure" | null,
    "notes": "Any additional notes for reviewer"
  }
}
```

---

## EXAMPLE CLASSIFICATIONS:

### Example 1: Clear Pattern 1 (Why School)

**Input**:
- School: Stanford
- Prompt: "Why Stanford? (100 words)"
- Word Count: 100

**Output**:
```json
{
  "primaryPattern": "why_this_school",
  "patternNumber": 1,
  "confidence": 98,
  "reasoning": "Prompt contains explicit 'Why [School]' signal word. School name appears in prompt. Asks directly about reasons for applying to this specific institution.",
  "signalWordsFound": {
    "primary": ["Why Stanford"],
    "secondary": []
  },
  "structuralMarkers": ["School name in prompt", "Direct 'why' question"],
  "isHybrid": false,
  "hybridDetails": null,
  "recommendedRubric": "PATTERN_1_WHY_SCHOOL_UNIVERSAL_RUBRIC",
  "recommendedOverlay": "STANFORD_WHY_SCHOOL_OVERLAY",
  "reuseOpportunity": "⭐",
  "similarPrompts": [
    {"school": "Yale", "wordCount": 125, "similarity": "very high"},
    {"school": "Duke", "wordCount": 250, "similarity": "very high"}
  ],
  "flags": {
    "requiresHumanReview": false,
    "reason": null,
    "notes": null
  }
}
```

### Example 2: Hybrid Pattern (Sequential)

**Input**:
- School: Princeton
- Prompt: "What academic areas most pique your curiosity, and how do the programs offered at Princeton suit your particular interests?"
- Word Count: 250

**Output**:
```json
{
  "primaryPattern": "why_major_academic_interest",
  "patternNumber": 2,
  "confidence": 92,
  "reasoning": "Prompt has two parts: (1) academic curiosity/interests, (2) how Princeton's programs connect. Sequential hybrid with Pattern 2 primary and Pattern 1 secondary.",
  "signalWordsFound": {
    "primary": ["academic areas", "curiosity", "interests"],
    "secondary": ["programs offered at Princeton"]
  },
  "structuralMarkers": ["Two-part question", "School name appears", "Academic focus first"],
  "isHybrid": true,
  "hybridDetails": {
    "type": "sequential",
    "secondaryPattern": "why_this_school",
    "secondaryPatternNumber": 1,
    "primaryWeight": 60,
    "secondaryWeight": 40
  },
  "recommendedRubric": "PATTERN_2_WHY_MAJOR_UNIVERSAL_RUBRIC + PATTERN_1_OVERLAY",
  "recommendedOverlay": "PRINCETON_WHY_MAJOR_OVERLAY",
  "reuseOpportunity": "⭐⭐",
  "similarPrompts": [
    {"school": "Yale", "wordCount": 200, "similarity": "high"},
    {"school": "Brown", "wordCount": 250, "similarity": "high"}
  ],
  "flags": {
    "requiresHumanReview": false,
    "reason": null,
    "notes": "Apply both rubrics with 60/40 weight split"
  }
}
```

### Example 3: Pattern 3 (Disagreement)

**Input**:
- School: Harvard
- Prompt: "Describe a time when you strongly disagreed with someone about an idea or issue. How did you communicate or engage with this person? What did you learn from this experience?"
- Word Count: 100-150

**Output**:
```json
{
  "primaryPattern": "disagreement_dialogue",
  "patternNumber": 3,
  "confidence": 99,
  "reasoning": "Prompt contains primary signal word 'disagreed' and asks about engagement/communication with another person holding different view. Classic Pattern 3 structure.",
  "signalWordsFound": {
    "primary": ["strongly disagreed", "engage with"],
    "secondary": ["communicate", "what did you learn"]
  },
  "structuralMarkers": ["Two perspectives", "Dialogue emphasis", "Learning outcome requested"],
  "isHybrid": false,
  "hybridDetails": null,
  "recommendedRubric": "PATTERN_3_DISAGREEMENT_UNIVERSAL_RUBRIC",
  "recommendedOverlay": "HARVARD_DISAGREEMENT_OVERLAY",
  "reuseOpportunity": "⭐⭐⭐⭐⭐",
  "similarPrompts": [
    {"school": "Yale", "wordCount": 400, "similarity": "exact"},
    {"school": "Emory", "wordCount": 150, "similarity": "exact"},
    {"school": "Duke", "wordCount": 200, "similarity": "very high"},
    {"school": "NYU", "wordCount": 250, "similarity": "high"},
    {"school": "WashU", "wordCount": 250, "similarity": "high"},
    {"school": "Dartmouth", "wordCount": 250, "similarity": "high"}
  ],
  "flags": {
    "requiresHumanReview": false,
    "reason": null,
    "notes": "EXACT DUPLICATE across 7 schools - very high reuse value"
  }
}
```

---

## EDGE CASES & HANDLING:

### Edge Case 1: Confidence < 70%
```json
{
  "primaryPattern": "best_guess_pattern",
  "confidence": 65,
  "flags": {
    "requiresHumanReview": true,
    "reason": "Low confidence - ambiguous structure",
    "notes": "Prompt does not clearly match any established pattern. Recommend manual classification."
  }
}
```

### Edge Case 2: Multiple Strong Matches (Not Hybrid)
If two patterns both show 85%+ confidence but don't form coherent hybrid:
- Select pattern with HIGHER structural marker match
- Flag for review
- Provide reasoning for tie-break

### Edge Case 3: Unusual Word Count
If word count is unusual for detected pattern (e.g., 1000-word "Why School"):
- Still classify based on content
- Add flag noting unusual length
- May indicate college wants more depth than typical

### Edge Case 4: School-Specific Quirks
Some schools frame patterns uniquely:
- MIT's "alignment" question = Pattern 1 (Why School) despite not using "why"
- Stanford's "roommate" question = Pattern 11 (Short Personal) but longer format
- Classify based on CORE INTENT, not just keywords

---

## QUALITY CHECKS:

Before returning output, verify:
1. ✅ Confidence score is justified by signal words + structure
2. ✅ If confidence > 85%, at least 2 primary signal words OR strong structural match
3. ✅ If hybrid, both patterns logically connect
4. ✅ Recommended rubric and overlay names are correctly formatted
5. ✅ Reuse opportunity rating aligns with pattern frequency data
6. ✅ Similar prompts (if any) are actually similar
7. ✅ Human review flag is set appropriately (< 70% confidence)

---

## NOW CLASSIFY THE PROMPT PROVIDED ABOVE

Return your classification in the specified JSON format.
```

---

## Post-Processing Instructions

After receiving JSON output from Haiku:

1. **Validate JSON structure** - Ensure all required fields present
2. **Check confidence threshold**:
   - If ≥ 85%: Proceed to Stage 2
   - If 70-84%: Proceed but flag for quality review after Stage 3
   - If < 70%: Route to human classifier, do not proceed automatically
3. **Log classification** for accuracy tracking
4. **Cache result** - Don't re-classify same prompt twice
5. **Load appropriate rubric** based on `recommendedRubric` field
6. **Load college overlay** based on `recommendedOverlay` field
7. **If hybrid**: Load both rubrics and prepare blended scoring approach

---

## Expected Performance Metrics

**Target Accuracy by Pattern**:
- Patterns 1-4 (Common): 98%+ accuracy
- Patterns 5-10 (Medium frequency): 95%+ accuracy
- Patterns 11-14 (Less common): 90%+ accuracy
- Overall: 95%+ accuracy

**Speed**: 2-3 seconds per classification average

**Cost**: $0.01 per classification (Haiku input + output tokens)

**Cache Hit Rate**: 40%+ (students often apply to overlapping school sets)

---

## Continuous Improvement

**Monthly Review Process**:
1. Analyze misclassifications from previous month
2. Identify new signal words or structural patterns
3. Update pattern database if needed
4. Retrain if accuracy falls below 93%
5. Add new prompts to training set as they emerge

**Feedback Loop**:
- If human reviewer overrides classification, log the correction
- If confidence was 70-85% and classification was wrong, add to training edge cases
- If pattern shows consistent misclassification, review pattern definition

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Confidence Target**: 95%+ overall accuracy
