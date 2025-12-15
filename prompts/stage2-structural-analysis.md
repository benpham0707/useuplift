# Stage 2: Structural Analysis - Complete Prompt Template

**Model**: Claude Haiku
**Estimated Cost**: $0.01 per essay
**Purpose**: Fast, mechanical validation of basic essay structure and compliance
**Processing Time**: 3-5 seconds

---

## System Prompt

```
You are a structural analysis system for college supplemental essays. Your task is to perform rapid, mechanical validation checks on essay structure, word count compliance, prompt adherence, and red/green flag detection.

You do NOT perform deep content analysis or provide subjective feedback. Your role is purely MECHANICAL VALIDATION:
- Check word count compliance (within acceptable range)
- Verify prompt adherence (does essay answer the question?)
- Detect critical red flags (rankings mentions, prestige focus, generic language)
- Identify green flags (specific research, unique details, concrete moments)
- Validate basic structure (opening, development, conclusion)

Your analysis must be FAST and ACCURATE. Focus on objective, verifiable criteria only.

OUTPUT REQUIREMENTS:
- Always return valid JSON
- Provide specific evidence (quotes) for all flags detected
- Calculate structural compliance score (0-100)
- Flag critical issues that would prevent essay from working
- Be precise with word count (exact count required)
```

---

## User Prompt Template

```
STRUCTURAL ANALYSIS TASK:

Analyze this supplemental essay for structural compliance and basic quality indicators.

---

**ESSAY TEXT**:
{{ESSAY_TEXT}}

---

**PROMPT**:
{{ESSAY_PROMPT}}

---

**METADATA**:
- School: {{SCHOOL_NAME}}
- Pattern Type: {{PATTERN_FROM_STAGE_1}}
- Required Word Count: {{WORD_COUNT_REQUIREMENT}}
- Actual Word Count: {{ACTUAL_WORD_COUNT}}
- Confidence from Pattern Recognition: {{CONFIDENCE_SCORE}}

---

## ANALYSIS CHECKLIST:

### 1. WORD COUNT COMPLIANCE

**Calculate Exact Word Count**:
- Count every word in essay (use standard word count rules)
- Compare to required word count range

**Compliance Scoring**:
- Within range (0% deviation): ✅ Full compliance (100 points)
- 1-10% over: ⚠️ Minor issue (90 points) - "Slightly over word count"
- 11-20% over: ⚠️ Moderate issue (70 points) - "Significantly over word count"
- 21%+ over: 🚨 Critical issue (40 points) - "Severely over word count, needs major cuts"
- 1-10% under: ⚠️ Minor issue (85 points) - "Slightly under word count, may lack depth"
- 11-20% under: ⚠️ Moderate issue (60 points) - "Significantly under word count, likely incomplete"
- 21%+ under: 🚨 Critical issue (30 points) - "Severely under word count, incomplete essay"

**Output**:
```json
{
  "wordCount": {
    "required": "{{WORD_COUNT_REQUIREMENT}}",
    "actual": {{EXACT_COUNT}},
    "deviation": "+X%" or "-Y%",
    "compliant": true/false,
    "score": 0-100,
    "issue": null | "slightly over" | "significantly over" | "severely over" | "slightly under" | "significantly under" | "severely under"
  }
}
```

---

### 2. PROMPT ADHERENCE

**Check if essay ANSWERS THE QUESTION ASKED**:

Review prompt requirements:
- Is this a single-part or multi-part prompt?
- What specific questions does prompt ask?
- Does essay address ALL parts of prompt?

**Multi-Part Prompt Detection**:
Look for:
- "AND" connecting multiple questions
- Numbered parts (1, 2, 3)
- Multiple questions in sequence
- "How" + "Why" combinations

**Adherence Scoring**:
- Answers all parts thoroughly: ✅ Full adherence (100 points)
- Answers all parts but one is weak: ⚠️ Partial adherence (75 points)
- Missing one part of multi-part prompt: 🚨 Critical issue (40 points)
- Doesn't answer the question: 🚨 Critical failure (10 points)

**Common Prompt Adherence Failures**:
1. **Pattern 1 (Why School)**: Essay talks about major/interests but never explains WHY THIS SCHOOL
2. **Pattern 2 (Why Major)**: Essay lists interests but doesn't explain WHY drawn to this field
3. **Pattern 3 (Disagreement)**: Essay describes disagreement but never explains what was LEARNED
4. **Pattern 4 (Community)**: Essay only shows "shaped by" but not "shaping" (when both required)
5. **Hybrid prompts**: Essay answers Part 1 but ignores Part 2

**Output**:
```json
{
  "promptAdherence": {
    "score": 0-100,
    "isMultiPart": true/false,
    "parts": [
      {
        "partNumber": 1,
        "question": "What part of prompt asks",
        "addressed": true/false,
        "evidence": "Quote from essay showing this part was addressed" or "MISSING"
      }
    ],
    "overallAdherence": "full" | "partial" | "missing parts" | "off-topic",
    "criticalIssues": ["Issue 1 description", "Issue 2 description"]
  }
}
```

---

### 3. BASIC STRUCTURE VALIDATION

**Check for Standard Essay Elements**:

**Opening (First 20-30% of essay)**:
- ✅ Has clear setup/context/hook
- ✅ Establishes what essay will be about
- ⚠️ Weak or generic opening
- 🚨 No real opening (jumps right into middle)

**Development (Middle 40-60% of essay)**:
- ✅ Develops ideas with specific examples/details
- ✅ Has clear progression or narrative
- ⚠️ Somewhat developed but could be more specific
- 🚨 No real development (all generic statements)

**Conclusion/Reflection (Final 20-30% of essay)**:
- ✅ Has meaningful reflection or conclusion
- ✅ Connects to broader significance or future
- ⚠️ Weak conclusion (just restates or ends abruptly)
- 🚨 No conclusion (essay just stops)

**Paragraph Structure**:
- ✅ Appropriate paragraph breaks
- ⚠️ One giant paragraph (readability issue)
- ⚠️ Too many short paragraphs (1-2 sentences each)

**Output**:
```json
{
  "structure": {
    "score": 0-100,
    "opening": {
      "quality": "strong" | "adequate" | "weak" | "missing",
      "issue": null | "Generic opening" | "No clear setup" | "Jumps into middle"
    },
    "development": {
      "quality": "strong" | "adequate" | "weak" | "missing",
      "issue": null | "Lacks specific examples" | "Too generic" | "No clear progression"
    },
    "conclusion": {
      "quality": "strong" | "adequate" | "weak" | "missing",
      "issue": null | "Abrupt ending" | "Just restates" | "No reflection"
    },
    "paragraphing": {
      "appropriate": true/false,
      "issue": null | "One giant paragraph" | "Too many short paragraphs"
    }
  }
}
```

---

### 4. RED FLAG DETECTION

**UNIVERSAL RED FLAGS** (Apply to All Essays):

#### 🚨 CRITICAL RED FLAGS (Severe penalties):

**RF1: RANKINGS / PRESTIGE MENTIONS** (-15 points)
- Signal words: "#1", "top-ranked", "most prestigious", "ranked", "top 5", "best", "number one"
- Example: "I want to attend Harvard because it's the #1 school"
- Why critical: Shows student cares about prestige, not actual fit
- Evidence required: Exact quote containing ranking/prestige language

**RF2: GENERIC PRAISE / COULD-WORK-ANYWHERE** (-20 points)
- Signal phrases: "renowned faculty", "world-class", "excellent education", "amazing opportunities", "great classes"
- Without SPECIFICS: If essay says "renowned faculty" but doesn't NAME any professors
- Example: "Stanford has amazing opportunities" (what opportunities? no specifics)
- Why critical: Could copy-paste to any top school, shows no research
- Evidence required: Generic phrase + note that no specific details follow

**RF3: PRESTIGE FOCUS OVER FIT** (-12 points)
- Indicators: Talks about school's reputation, awards, famous alumni, selectivity
- Without balancing with FIT: If only reason given is prestige/reputation
- Example: "Harvard has produced 8 presidents and 160 Nobel laureates"
- Why critical: Admissions wants students who fit, not prestige-seekers
- Evidence required: Quote showing prestige focus without fit articulation

**RF4: WEATHER / LOCATION AS PRIMARY REASON** (-5 points)
- For Pattern 1 (Why School) specifically
- If weather/location is ONLY reason or PRIMARY reason mentioned
- Example: "I love California weather" or "I want to live in Boston"
- Why problematic: Shallow reason for college choice
- Note: Mentioning location is fine if paired with substantive reasons
- Evidence required: Quote + note that no other substantial reasons given

**RF5: NO SPECIFIC RESEARCH EVIDENT** (-15 points)
- For Pattern 1 (Why School) and hybrid prompts with school component
- No mention of: Specific programs, specific professors, specific courses, specific resources
- All references are generic: "great programs", "excellent research", "strong department"
- Why critical: Shows student didn't do basic research
- Evidence required: Note that entire essay lacks any specific names/numbers/programs

#### ⚠️ HIGH-SEVERITY RED FLAGS (Significant penalties):

**RF6: SAVIOR COMPLEX / WHITE SAVIOR NARRATIVE** (-20 points)
- For Pattern 4 (Community) essays about service/volunteering
- Language that positions student as "saving" or "helping" less fortunate people
- Lacks acknowledgment of what student LEARNED from community
- Example: "I taught underprivileged kids who had never seen success before"
- Why critical: Shows lack of awareness, treats people as charity cases
- Evidence required: Specific condescending or savior-complex language

**RF7: WINNING THE ARGUMENT** (-20 points)
- For Pattern 3 (Disagreement) essays
- Essay focuses on how student WON argument or convinced other person
- Dismissive of other person's perspective
- Example: "I explained why they were wrong and they eventually understood"
- Why critical: Shows student doesn't value other perspectives, just wants to win
- Evidence required: Language showing dismissiveness or "winning" mentality

**RF8: POLITICAL GRANDSTANDING** (-15 points)
- For Pattern 3 (Disagreement) or any essay discussing political issues
- Essay is more about political position than personal growth
- Takes extreme partisan stance without nuance
- Dismissive of those who disagree
- Why problematic: Admissions doesn't want political essays, wants personal growth
- Evidence required: Political stance stated without personal insight or growth

**RF9: SUPERFICIAL LEARNING / GENERIC "I LEARNED"** (-10 points)
- For Pattern 3 (Disagreement), Pattern 5 (Challenge) essays
- Essay states "I learned X" but doesn't SHOW how or provide evidence
- Generic lessons: "I learned to never give up", "I learned the importance of hard work"
- Why problematic: Lacks depth, feels cliché
- Evidence required: Generic learning statement without supporting details

**RF10: NO CONCRETE DIALOGUE OR MOMENTS** (-15 points)
- For Pattern 3 (Disagreement), Pattern 4 (Community) essays
- Entire essay is abstract/summary level
- No specific conversations, moments, scenes, or details
- Example: "We had many discussions about this issue" (what discussions? when? what was said?)
- Why critical: Feels inauthentic, possibly fabricated
- Evidence required: Note that no concrete moments exist in essay

#### ⚠️ MEDIUM-SEVERITY RED FLAGS (Moderate penalties):

**RF11: RESUME LISTING / ACHIEVEMENTS FOCUS** (-18 points)
- For Pattern 4 (Community), Pattern 6 (Activity) essays
- Essay lists accomplishments instead of telling story
- Reads like resume bullet points in paragraph form
- Example: "I founded 3 clubs, raised $10,000, and mentored 50 students"
- Why problematic: Admissions already has resume, wants story/growth
- Evidence required: Multiple achievement listings without narrative

**RF12: VICTIM NARRATIVE / NO AGENCY** (-12 points)
- For Pattern 5 (Challenge) essays
- Essay focuses on being victim without showing response/agency
- Passive throughout - things happened TO student
- No demonstration of resilience or problem-solving
- Why problematic: Admissions wants to see agency and resilience
- Evidence required: Passive language throughout, no active response shown

**RF13: HERO NARRATIVE / NO VULNERABILITY** (-10 points)
- For Pattern 5 (Challenge) essays
- Essay presents student as perfect hero who overcame easily
- No real struggle or vulnerability shown
- Feels performative or exaggerated
- Why problematic: Lacks authenticity, doesn't show genuine growth
- Evidence required: Overly positive tone, no acknowledgment of difficulty

**RF14: ONE-WAY RELATIONSHIP** (-12 to -25 points depending on prompt)
- For Pattern 4 (Community) essays
- CRITICAL for Cornell (-25 points): Prompt explicitly requires bidirectional
- Essay shows only "I shaped community" OR only "community shaped me"
- Doesn't show reciprocal relationship when required
- Evidence required: Note which direction is missing

#### 📝 PATTERN-SPECIFIC RED FLAGS:

Load additional red flags based on pattern type from Stage 1:

**If Pattern 1 (Why School)**:
- Load universal red flags RF1-RF5
- Add college-specific red flags from overlay

**If Pattern 2 (Why Major)**:
- No superficial interest (must show depth)
- No "parent wants me to" reasoning
- No pure career focus without intellectual curiosity

**If Pattern 3 (Disagreement)**:
- Load RF7 (Winning), RF8 (Political), RF9 (Superficial Learning), RF10 (No Concrete Moments)

**If Pattern 4 (Community)**:
- Load RF6 (Savior Complex), RF10 (No Concrete Moments), RF11 (Resume Listing), RF14 (One-Way)

**If Pattern 5 (Challenge)**:
- Load RF9 (Superficial Learning), RF12 (Victim), RF13 (Hero)

**If Pattern 6 (Activity)**:
- Load RF11 (Resume Listing)

**Output**:
```json
{
  "redFlags": {
    "totalPenalty": -X points,
    "flagsDetected": [
      {
        "flagId": "RF1",
        "flagName": "RANKINGS_PRESTIGE_MENTION",
        "severity": "critical",
        "penalty": -15,
        "evidence": "Exact quote from essay",
        "location": "Paragraph 2, sentence 3",
        "note": "Student mentions 'top-ranked' without specific programs"
      }
    ],
    "criticalFlags": ["RF1", "RF2"],
    "requiresImmediateAttention": true/false
  }
}
```

---

### 5. GREEN FLAG DETECTION

**UNIVERSAL GREEN FLAGS** (Apply to All Essays):

#### ✅ HIGH-VALUE GREEN FLAGS (Significant boosts):

**GF1: SPECIFIC PROFESSOR / RESEARCH UNDERSTANDING** (+12 points)
- Student names specific professor AND demonstrates understanding of their work
- Not just "Professor X teaches Y" but "Professor X's research on Z relates to my interest in W"
- Example: "Professor Sarah Martinez's work on sustainable polymers aligns with my goal of..."
- Why valuable: Shows genuine research and intellectual engagement
- Evidence required: Professor name + their work described + connection to student

**GF2: SPECIFIC LESSER-KNOWN RESOURCES** (+10 points)
- Student mentions program/resource that's NOT in top 5 Google results
- Shows deep research beyond admissions website homepage
- Examples: Specific lab names, niche programs, specific course numbers, unique resources
- Example: "MIT's d'Arbeloff Laboratory for advanced manufacturing" (not just "MIT has great labs")
- Why valuable: Proves student did thorough research
- Evidence required: Specific resource name that's not widely known

**GF3: BIDIRECTIONAL IMPACT CLEARLY SHOWN** (+15 points)
- For Pattern 4 (Community) essays
- Essay explicitly shows BOTH shaped by AND shaping community
- Uses specific examples for each direction
- Example: "The debate team taught me to think critically (shaped by), and I introduced..."
- Why valuable: Directly addresses prompt requirement and shows maturity
- Evidence required: Clear examples of both directions with specific details

**GF4: CHANGED PERSPECTIVE / INTELLECTUAL HUMILITY** (+15 points)
- For Pattern 3 (Disagreement) essays
- Student admits they were wrong OR changed their mind
- Shows willingness to evolve thinking based on new info
- Example: "This conversation made me realize my initial assumption was flawed"
- Why valuable: Shows intellectual humility and growth mindset
- Evidence required: Explicit statement of changed thinking

**GF5: MAINTAINED RELATIONSHIP** (+10 points)
- For Pattern 3 (Disagreement) essays
- After disagreement, relationship with person was preserved or strengthened
- Shows maturity in handling conflict
- Evidence required: Statement about relationship status after disagreement

#### ✅ MEDIUM-VALUE GREEN FLAGS (Moderate boosts):

**GF6: UNEXPECTED COMMUNITY / UNIQUE PERSPECTIVE** (+12 points)
- For Pattern 4 (Community) essays
- Community choice is unexpected, creative, or unique
- Not the obvious choice (sports team, school club)
- Examples: Online community, unusual family structure, niche interest group
- Why valuable: Shows originality and authentic connection
- Evidence required: Description of unusual community

**GF7: SPECIFIC CONVERSATION MOMENTS / DIALOGUE** (+8 to +10 points)
- For Pattern 3 (Disagreement), Pattern 4 (Community), Pattern 7 (Joy) essays
- Includes actual dialogue or very specific conversational moments
- Not summary but actual "scene" with details
- Example: "She said, 'Have you considered...' and I realized..."
- Why valuable: Shows authenticity, hard to fake specific moments
- Evidence required: Specific quoted or paraphrased dialogue

**GF8: NUANCED UNDERSTANDING / BOTH SIDES PRESENTED** (+10 points)
- For Pattern 3 (Disagreement) essays
- Essay fairly presents BOTH perspectives
- Shows complexity and avoids oversimplification
- Student understands other person's reasoning even if disagrees
- Why valuable: Shows intellectual maturity
- Evidence required: Fair presentation of opposing view

**GF9: VULNERABILITY DEMONSTRATED** (+12 points)
- For Pattern 5 (Challenge), Pattern 3 (Disagreement) essays
- Student shows genuine vulnerability or admits struggle
- Not performative, but authentic difficulty
- Why valuable: Shows authenticity and self-awareness
- Evidence required: Specific vulnerable moment or admission

**GF10: ONGOING COMMITMENT / SUSTAINED ENGAGEMENT** (+8 points)
- For Pattern 4 (Community), Pattern 6 (Activity) essays
- Shows multi-year commitment or sustained engagement
- Not one-time involvement but ongoing relationship
- Why valuable: Shows depth of commitment
- Evidence required: Timeline showing sustained engagement

**GF11: CONTRIBUTION FOCUS / WHAT STUDENT WILL GIVE** (+6 points)
- For Pattern 1 (Why School), Pattern 4 (Community) essays
- Essay emphasizes what student will CONTRIBUTE, not just what they'll get
- Forward-looking and community-minded
- Why valuable: Shows maturity and community orientation
- Evidence required: Specific contributions mentioned

**GF12: SENSORY DETAILS / SPECIFIC IMAGERY** (+8 points)
- Any pattern
- Essay includes specific sensory details (sights, sounds, smells, textures)
- Makes scene come alive
- Example: "The smell of solder and hum of 3D printers in the makerspace..."
- Why valuable: Shows authenticity, creates vivid narrative
- Evidence required: Specific sensory language

**GF13: UNEXPECTED WORD CHOICES / NATURAL VOICE** (+10 points)
- Any pattern
- Student uses unexpected but effective word choices
- Natural voice that doesn't sound AI-generated or thesaurus-heavy
- Sentence variety including fragments or natural speech patterns
- Why valuable: Shows authentic student voice
- Evidence required: Examples of natural, effective language

**Output**:
```json
{
  "greenFlags": {
    "totalBoost": +X points,
    "flagsDetected": [
      {
        "flagId": "GF1",
        "flagName": "SPECIFIC_PROFESSOR_RESEARCH_UNDERSTANDING",
        "boost": +12,
        "evidence": "Exact quote from essay",
        "location": "Paragraph 3",
        "note": "Student names Professor Martinez and shows understanding of her polymer research"
      }
    ],
    "strengths": ["Specific research evident", "Shows intellectual curiosity"]
  }
}
```

---

### 6. CALCULATE STRUCTURAL COMPLIANCE SCORE

**Scoring Formula**:
```
Base Score = 100 points

Word Count Score (0-100)
+ Prompt Adherence Score (0-100)
+ Structure Score (0-100)
= Subtotal / 3 = Average Structural Score

Structural Score
- Red Flag Penalties (sum of all red flags)
+ Green Flag Boosts (sum of all green flags, max +40 total)
= FINAL STRUCTURAL SCORE (0-100)
```

**Score Interpretation**:
- 90-100: ✅ Excellent structural compliance
- 80-89: ✅ Good structural compliance, minor issues
- 70-79: ⚠️ Adequate but needs improvement
- 60-69: ⚠️ Significant structural issues
- Below 60: 🚨 Critical structural problems, major revision needed

**Output**:
```json
{
  "structuralScore": {
    "finalScore": 0-100,
    "breakdown": {
      "wordCountScore": 0-100,
      "promptAdherenceScore": 0-100,
      "structureScore": 0-100,
      "averageBase": 0-100,
      "redFlagPenalties": -X,
      "greenFlagBoosts": +Y,
      "netAdjustment": -X+Y
    },
    "interpretation": "Excellent" | "Good" | "Adequate" | "Needs improvement" | "Critical issues",
    "passesStructuralCheck": true/false
  }
}
```

---

## COMPLETE OUTPUT FORMAT (JSON):

```json
{
  "structuralAnalysis": {
    "timestamp": "ISO 8601 timestamp",
    "processingTime": "X seconds",

    "wordCount": {
      "required": "{{WORD_COUNT_REQUIREMENT}}",
      "actual": {{EXACT_COUNT}},
      "deviation": "+X%" or "-Y%",
      "compliant": true/false,
      "score": 0-100,
      "issue": null | "slightly over" | "significantly over" | "severely over" | "slightly under" | "significantly under" | "severely under"
    },

    "promptAdherence": {
      "score": 0-100,
      "isMultiPart": true/false,
      "parts": [
        {
          "partNumber": 1,
          "question": "What this part asks",
          "addressed": true/false,
          "evidence": "Quote or MISSING"
        }
      ],
      "overallAdherence": "full" | "partial" | "missing parts" | "off-topic",
      "criticalIssues": []
    },

    "structure": {
      "score": 0-100,
      "opening": {
        "quality": "strong" | "adequate" | "weak" | "missing",
        "issue": null | "Issue description"
      },
      "development": {
        "quality": "strong" | "adequate" | "weak" | "missing",
        "issue": null | "Issue description"
      },
      "conclusion": {
        "quality": "strong" | "adequate" | "weak" | "missing",
        "issue": null | "Issue description"
      },
      "paragraphing": {
        "appropriate": true/false,
        "issue": null | "Issue description"
      }
    },

    "redFlags": {
      "totalPenalty": -X,
      "flagsDetected": [
        {
          "flagId": "RF1",
          "flagName": "FLAG_NAME",
          "severity": "critical" | "high" | "medium",
          "penalty": -X,
          "evidence": "Quote",
          "location": "Location in essay",
          "note": "Explanation"
        }
      ],
      "criticalFlags": ["RF1", "RF2"],
      "requiresImmediateAttention": true/false
    },

    "greenFlags": {
      "totalBoost": +X,
      "flagsDetected": [
        {
          "flagId": "GF1",
          "flagName": "FLAG_NAME",
          "boost": +X,
          "evidence": "Quote",
          "location": "Location in essay",
          "note": "Explanation"
        }
      ],
      "strengths": ["Strength 1", "Strength 2"]
    },

    "structuralScore": {
      "finalScore": 0-100,
      "breakdown": {
        "wordCountScore": 0-100,
        "promptAdherenceScore": 0-100,
        "structureScore": 0-100,
        "averageBase": 0-100,
        "redFlagPenalties": -X,
        "greenFlagBoosts": +Y,
        "netAdjustment": X
      },
      "interpretation": "Excellent" | "Good" | "Adequate" | "Needs improvement" | "Critical issues",
      "passesStructuralCheck": true/false
    },

    "criticalIssuesSummary": [
      "Issue 1: Description",
      "Issue 2: Description"
    ],

    "readyForStage3": true/false,
    "flagsForHumanReview": []
  }
}
```

---

## EDGE CASES & SPECIAL HANDLING:

### Edge Case 1: Very Short Essays (< 100 words)
- Skip conclusion quality check (not enough space)
- Adjust structure expectations
- Focus on efficiency and clarity

### Edge Case 2: Very Long Essays (> 500 words)
- Expect more sophisticated structure
- Higher bar for development quality
- Multiple paragraphs required

### Edge Case 3: List-Format Prompts
- Some prompts ask for lists (Stanford's "5 things important to you")
- Don't penalize for lack of essay structure
- Check if items have brief elaboration when required

### Edge Case 4: Creative/Quirky Prompts (Pattern 12)
- Traditional structure may not apply
- Focus on creativity and originality
- Different flag set applies

### Edge Case 5: Hybrid Prompts
- Ensure BOTH parts are addressed
- May need to check two different flag sets
- Score each component separately then combine

---

## QUALITY ASSURANCE:

Before returning output, verify:
1. ✅ Word count is EXACT (not estimated)
2. ✅ Every red/green flag has EVIDENCE (quote from essay)
3. ✅ Multi-part prompts have each part checked
4. ✅ Scores add up correctly in formula
5. ✅ Critical flags trigger "requiresImmediateAttention" = true
6. ✅ If passesStructuralCheck = false, critical issues are clearly listed
7. ✅ JSON is valid and complete

---

## NOW ANALYZE THE ESSAY PROVIDED ABOVE

Return your structural analysis in the specified JSON format.
```

---

## Post-Processing Instructions

After receiving JSON output from Haiku:

1. **Validate JSON structure** - Ensure all required fields present
2. **Check if essay passes structural check**:
   - If passesStructuralCheck = true: Proceed to Stage 3
   - If passesStructuralCheck = false: Flag for immediate teaching intervention (may skip Stage 3 if issues too severe)
3. **Log critical issues** for teaching layer prioritization
4. **Prepare flag data** for Stage 3 (content analysis will build on these flags)
5. **If critical red flags detected**: Escalate priority for teaching intervention

---

## Expected Performance Metrics

**Speed**: 3-5 seconds per essay

**Accuracy Targets**:
- Word count: 100% accurate (mechanical count)
- Red flag detection: 90%+ precision (minimize false positives)
- Green flag detection: 85%+ precision
- Prompt adherence: 95%+ accurate for multi-part detection

**Cost**: $0.01 per analysis (Haiku input + output tokens)

---

## Integration with Stage 3

**Data Handoff to Stage 3 (Content Analysis)**:
- Red/green flags detected in Stage 2 inform Stage 3 dimension scoring
- Critical issues from Stage 2 become top priorities for Stage 4 (Teaching)
- Structural score combines with content score for final evaluation

**Example**:
- Stage 2 detects RF1 (Rankings Mention): -15 points
- Stage 3 scores "research_depth" dimension low due to lack of specifics
- Combined, these indicate student needs teaching on SPECIFIC research vs. prestige focus
- Stage 4 (Teaching) prioritizes this as Critical Issue #1

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Processing Target**: < 5 seconds per essay
