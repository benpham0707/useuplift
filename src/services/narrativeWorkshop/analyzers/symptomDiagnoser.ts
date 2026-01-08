/**
 * Symptom Diagnoser Service
 * 
 * A specialized analyzer that identifies the specific NARRATIVE WEAKNESS in a target snippet.
 * This runs BEFORE generation to ensure the "Surgical Editor" knows exactly what problem to solve.
 * 
 * Instead of relying on the Rubric Category (which is broad), this identifies the Symptom (Specific).
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';

export interface SymptomDiagnosis {
    diagnosis: string; // "Passive voice masking agency"
    specific_weakness: string; // "The verb 'was captivated' is abstract."
    prescription: string; // "Convert to active verb showing the moment of fascination."
    symptom_type: SymptomType;
    missing_elements: {
        sensory_details?: string[]; // What specific sensory anchors are missing?
        concrete_objects?: string[]; // What objects/numbers/specifics could ground this?
        micro_moment?: string; // What grounding scene/moment is missing?
        emotional_truth?: string; // What feeling is told but not shown?
    };
}

/**
 * Symptom types including opening-specific weaknesses
 * Based on deep research from admissions officers and writing experts
 */
export type SymptomType =
    // Original types
    | 'abstract_language'
    | 'passive_agency'
    | 'cliche_metaphor'
    | 'telling_not_showing'
    | 'generic_pacing'
    | 'weak_verb'
    // Opening-specific types (based on essay openings research)
    | 'dictionary_definition_opening'    // "The dictionary defines..."
    | 'childhood_opening_cliche'         // "Ever since I was young..." "From an early age..."
    | 'famous_quote_opening'             // Opening with famous person quote
    | 'rhetorical_question_flat'         // Generic "Have you ever..." questions
    | 'thesis_statement_opening'         // Academic thesis instead of narrative hook
    | 'melodramatic_opening'             // "Little did I know my life would change forever"
    | 'generic_scene_setting'            // Elaborate scene with no story connection
    | 'weak_opening'                     // General weak opening that doesn't engage
    | 'generic_opening'                  // Could apply to anyone's essay
    // Ending-specific types (based on essay endings research)
    | 'weak_ending'                      // General weak ending that doesn't leave impact
    | 'abrupt_ending'                    // Lacks closure, ends too suddenly
    | 'anticlimactic_ending'             // Doesn't deliver on emotional peak
    | 'summary_conclusion'               // Rehashes what was already said
    | 'preachy_ending'                   // Moral lesson that hits reader over head
    | 'generic_ending'                   // Could apply to anyone's essay
    | 'excited_to_attend_ending'         // "I can't wait to attend X University"
    | 'sudden_pivot_ending'              // Abrupt shift to college mention
    | 'false_resolution_ending'          // Claims problem solved that wasn't
    | 'career_announcement_ending'       // "That's when I decided to become a doctor"
    | 'overexplained_ending'             // Tells reader what to think
    | 'repetitive_ending'                // Repeats essay content unnecessarily
    | 'abstract_ending'                  // Ends with vague abstractions
    | 'academic_ending';                 // Thesis-conclusion style instead of narrative

const DIAGNOSIS_SYSTEM_PROMPT = `You are a precise Narrative Diagnostician.
Your job is to look at a specific sentence from a college essay and identify its NARRATIVE WEAKNESS.
Do not rewrite it. Just diagnose it with DEPTH.

**Classification Types:**

GENERAL WEAKNESSES:
1. **abstract_language**: Uses concepts (success, passion, values) without concrete anchors.
2. **passive_agency**: Things happen to the narrator ("I was tasked", "Ideas flowed") rather than narrator doing things.
3. **cliche_metaphor**: Overused comparisons (puzzles, journeys, unlocking).
4. **telling_not_showing**: Summarizing events ("I worked hard") instead of depicting them.
5. **generic_pacing**: Flat sentence structure that kills momentum.
6. **weak_verb**: Using "to be" verbs or static verbs instead of action.

OPENING-SPECIFIC WEAKNESSES (use these when analyzing essay openings):
7. **dictionary_definition_opening**: Opening with "The dictionary defines..." or "According to Merriam-Webster...".
   - WHY IT FAILS: Pedantic, impersonal, says nothing about the student. AOs report this creates a "sigh" reaction.

8. **childhood_opening_cliche**: Variations of "Ever since I was young," "From an early age," "Throughout my life," "Since I was a child."
   - WHY IT FAILS: THE most common cliché. AOs want CURRENT interests (that's why rec letters are from 11th/12th grade teachers). Childhood memories are vague and general.

9. **famous_quote_opening**: Opening with quotes from famous figures (Gandhi, Einstein, Obama).
   - WHY IT FAILS: Displaces the student's voice. Only 4.6% of successful essays use this. Personal dialogue works; famous quotes don't.

10. **rhetorical_question_flat**: Generic questions like "Have you ever wondered...?" "Have you ever felt...?"
    - WHY IT FAILS: Can often be answered with "no," creates disengagement, sounds like everyone else.

11. **thesis_statement_opening**: Academic thesis-style opening ("This essay will discuss..." or "I am a tolerant person who...").
    - WHY IT FAILS: Signals academic paper, not personal narrative. Tells rather than shows. Wrong register.

12. **melodramatic_opening**: "Little did I know, my life was about to change forever" or similar.
    - WHY IT FAILS: Generic (could open any essay), exaggerated, creates distance, promises more than it delivers.

13. **generic_scene_setting**: Elaborate scene description disconnected from the story ("It was a raw autumn day...").
    - WHY IT FAILS: "Thesaurus abuse," wastes precious opening space, creates wrong expectations.

14. **weak_opening**: General opening that doesn't create engagement or urgency.
    - WHY IT FAILS: AOs read 30-50 essays daily. First paragraph must grab attention. Research shows 8-second attention window (~17 words).

15. **generic_opening**: Opening that could apply to anyone's essay—fails the Grace Kim test: "Could you put anyone else's name on this?"
    - WHY IT FAILS: The opening should be so personal that it couldn't be true about another student.

ENDING-SPECIFIC WEAKNESSES (use these when analyzing essay conclusions):
16. **weak_ending**: General weak ending that doesn't leave impact or create lasting memory.
    - WHY IT FAILS: Peak-end rule shows endings disproportionately shape how AOs remember essays. 85% of essays get neutral "check marks."

17. **abrupt_ending**: Ends too suddenly without emotional or structural closure.
    - WHY IT FAILS: Satisfying endings "remember where they came from" and shift scope from specific to wider reflection. Abrupt endings feel incomplete.

18. **anticlimactic_ending**: Doesn't deliver on the emotional peak or promise of the essay.
    - WHY IT FAILS: Best endings combine surprise with inevitability (Aristotle). Anticlimactic endings create disappointment, waste built tension.

19. **summary_conclusion**: Rehashes what was already said ("In conclusion, I learned that...").
    - WHY IT FAILS: AOs already read the body. Summary endings waste precious ending space, feel academic rather than narrative.

20. **preachy_ending**: Moral lesson that hits reader over the head ("This taught me the importance of...").
    - WHY IT FAILS: Shows rather than trusts. Expert axiom: "Understatement beats overstatement." Let reader draw conclusions.

21. **generic_ending**: Could apply to anyone's essay, lacks the specificity that made the essay personal.
    - WHY IT FAILS: Same test as openings—if you could paste it onto another student's essay, it's too generic.

22. **excited_to_attend_ending**: "I can't wait to attend [University]!" or "This is why [University] is perfect for me!"
    - WHY IT FAILS: "College lust" signals insecurity. Admission isn't the story's climax; your growth is.

23. **sudden_pivot_ending**: Abrupt, forced mention of the college with no organic connection.
    - WHY IT FAILS: Feels like an advertisement grafted onto personal narrative. Jarring tone shift.

24. **false_resolution_ending**: Claims a problem was completely solved when it clearly wasn't.
    - WHY IT FAILS: "I now have perfect confidence" after describing crippling anxiety. Dishonest, undermines credibility.

25. **career_announcement_ending**: "That's when I decided to become a doctor/lawyer/engineer."
    - WHY IT FAILS: Career goals aren't narrative endings. Essays reveal character, not career plans. Sounds formulaic.

26. **overexplained_ending**: Tells reader exactly what to think and feel about the essay.
    - WHY IT FAILS: "Leave space for the reader." Best endings suggest rather than state. Trust reader intelligence.

27. **repetitive_ending**: Repeats content or phrases from earlier in the essay.
    - WHY IT FAILS: Harry Bauld: "Remember where you came from, without repeating what you've already said."

28. **abstract_ending**: Ends with vague abstractions instead of concrete image or moment.
    - WHY IT FAILS: Research shows concrete endings are more memorable than abstract ones. End with image, not idea.

29. **academic_ending**: Thesis-conclusion style appropriate for essays, not personal narrative.
    - WHY IT FAILS: Wrong register. Personal essays need narrative conclusions, not argumentative wrap-ups.

**CRITICAL: Identify Missing Elements**

For EVERY diagnosis, you must identify what's MISSING that would make this brilliant:

1. **sensory_details**: What specific sights, sounds, textures, or physical details are absent?
   - Example: Instead of "I felt frustrated" → MISSING: "the blinking cursor", "the red error text", "crumpled paper"

2. **concrete_objects**: What numbers, ages, specific objects, or proper nouns would ground this?
   - Example: Instead of "many sets" → MISSING: "fourteen different Lego sets", "the Ninjago spacecraft"

3. **micro_moment**: What single grounding scene or moment would anchor this abstraction?
   - Example: Instead of "I lost interest" → MISSING: "The last time I touched my Legos, I tried to rebuild..."

4. **emotional_truth**: What specific feeling is being TOLD but not SHOWN through action/reaction?
   - Example: Instead of "I was passionate" → MISSING: "I'd been tracking Jordan 1 prices for months"

**Output Format:**
JSON with fields: {
  diagnosis,
  specific_weakness,
  prescription,
  symptom_type,
  missing_elements: {
    sensory_details: ["blinking cursor", "red error messages"],
    concrete_objects: ["line 47", "semicolon"],
    micro_moment: "The moment they first saw the error",
    emotional_truth: "The specific frustration of not understanding"
  }
}
`;

export async function diagnoseSymptom(quote: string, surroundingContext: string): Promise<SymptomDiagnosis> {
    const prompt = `
    Analyze this text snippet:
    "${quote}"
    
    Context:
    "...${surroundingContext.substring(0, 100)}..."

    Diagnose the specific narrative weakness.
    `;

    try {
        const response = await callClaudeWithRetry(prompt, {
            systemPrompt: DIAGNOSIS_SYSTEM_PROMPT,
            temperature: 0.1, // High precision
            maxTokens: 400, // Increased for missing_elements
            useJsonMode: true
        });

        const result = typeof response.content === 'string' ? JSON.parse(response.content) : response.content;
        return {
            diagnosis: result.diagnosis || "General weakness detected",
            specific_weakness: result.specific_weakness || "Text lacks impact",
            prescription: result.prescription || "Strengthen imagery",
            symptom_type: result.symptom_type || "abstract_language",
            missing_elements: result.missing_elements || {
                sensory_details: [],
                concrete_objects: [],
                micro_moment: undefined,
                emotional_truth: undefined
            }
        };
    } catch (e) {
        console.error("Error in Symptom Diagnoser:", e);
        return {
            diagnosis: "Analysis failed",
            specific_weakness: "Could not determine specific weakness",
            prescription: "Improve clarity and specificty",
            symptom_type: "abstract_language",
            missing_elements: {
                sensory_details: [],
                concrete_objects: [],
                micro_moment: undefined,
                emotional_truth: undefined
            }
        };
    }
}
























