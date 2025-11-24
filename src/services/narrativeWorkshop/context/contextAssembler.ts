/**
 * Surgical Context Assembler (Layer 4)
 * 
 * This component assembles a "Highly Specialized Context Document" (Case File)
 * for the Surgical Editor. Instead of a raw prompt, this document provides
 * a deep, multi-faceted understanding of the specific narrative problem.
 * 
 * It aggregates:
 * 1. Clinical Diagnosis (Layer 1)
 * 2. Contextual Examples (Layer 2)
 * 3. Voice Identity & Samples (Layer 3)
 * 4. Strategic Directives (Layer 4)
 */

import { VoiceFingerprint, HolisticUnderstanding } from '../types';
import { DetectedLocator } from '../analyzers/locatorAnalyzers';
import { SymptomDiagnosis } from '../analyzers/symptomDiagnoser';
import { NarrativeStrategy } from '../strategies';
import { getExamplesForCategory } from '../surgicalExamples';
import { COMPREHENSIVE_TEACHING_PROTOCOL } from '../validation/rationaleStandards';

export interface SurgicalContextBundle {
    contextDocument: string;
    complexityTier: string;
}

export function assembleSurgicalContext(
    issue: DetectedLocator,
    voice: VoiceFingerprint,
    essaySegment: string,
    divergentStrategy: NarrativeStrategy,
    diagnosis: SymptomDiagnosis,
    holisticContext?: HolisticUnderstanding,
    overallScore: number = 50
): SurgicalContextBundle {

    // 1. Determine Complexity Tier
    let complexityTier = "Competent";
    if (overallScore < 30) complexityTier = "Basic";
    else if (overallScore < 50) complexityTier = "Competent";
    else if (overallScore < 70) complexityTier = "Advanced";
    else complexityTier = "Elite";

    // 2. Fetch Targeted Examples
    const examples = getExamplesForCategory(
        issue.rubricCategory, 
        2, 
        voice.tone, 
        diagnosis.symptom_type
    );

    // 3. Build the Sections
    const clinicalChart = buildClinicalChart(diagnosis, issue);
    const voiceProfile = buildVoiceProfile(voice);
    const referenceLibrary = buildReferenceLibrary(examples);
    const writingProtocol = buildWritingProtocol(); // Phase 15: Writing quality standards
    const teachingProtocol = buildTeachingProtocol(); // Phase 14: Enhanced rationale standards
    const strategicDirectives = buildStrategicDirectives(divergentStrategy, complexityTier);
    const holisticBrief = buildHolisticBrief(holisticContext);

    // 4. Assemble the Document
    const contextDocument = `
# NARRATIVE CASE FILE: ${issue.rubricCategory}
**Status:** ${complexityTier}
**Target:** "${issue.quote}"

---

## 1. CLINICAL CHART (DIAGNOSIS)
${clinicalChart}

---

## 2. VOICE PROFILE (IDENTITY)
${voiceProfile}

---

## 3. HOLISTIC BRIEF (CONTEXT)
${holisticBrief}

---

## 4. REFERENCE LIBRARY (GOLD STANDARDS)
${referenceLibrary}

---

## 5. WRITING PROTOCOL (THE CRAFT)
${writingProtocol}

---

## 6. TEACHING PROTOCOL (THE MENTOR)
${teachingProtocol}

---

## 7. STRATEGIC DIRECTIVES (EXECUTION PLAN)
${strategicDirectives}

---

## 8. TARGET TEXT SEGMENT
${essaySegment}
`;

    return {
        contextDocument,
        complexityTier
    };
}

function buildWritingProtocol(): string {
    return `
**AUTHENTICITY-FIRST WRITING STANDARDS:**

The goal is NOT "good writing" - it's writing that sounds like THIS SPECIFIC PERSON.

**1. SHOW DON'T TELL - But Make It Personal**
Don't just describe "a physical reaction" - describe THIS person's specific reaction.
- Generic show: "My heart raced"
- Personal show: "I did that thing where I bite my thumbnail without realizing"

**2. SPECIFICITY THAT REVEALS CHARACTER**
Details should tell us WHO this person is, not just WHAT happened.
- Generic specific: "I practiced for 3 hours"
- Character-revealing: "I practiced until Mom started flicking the lights - our signal for 'enough already'"

**3. REAL INTERIORITY - The Messy Truth**
What was ACTUALLY going through their head? Include:
- The doubts ("What if this doesn't work?")
- The weird tangent thoughts
- The honest, sometimes unflattering reactions
- The specific way THIS person processes things

**4. UNIQUE LENS**
What's this person's distinctive way of seeing things?
- Their particular metaphors or comparisons
- References to their specific world (hobbies, family, culture)
- The connections only THEY would make

**5. VOICE MATCHING**
- Match their sentence rhythms from Voice Samples
- Use vocabulary at THEIR level (don't elevate)
- Keep their quirks and patterns

**AVOID:**
- Writing that "sounds impressive" but could be anyone
- Generic insights or life lessons
- Language that feels templated or AI-generated
- Listing accomplishments without showing the person behind them
`;
}

function buildClinicalChart(diagnosis: SymptomDiagnosis, issue: DetectedLocator): string {
    // Build missing elements section
    let missingElementsSection = '';
    if (diagnosis.missing_elements) {
        const { sensory_details, concrete_objects, micro_moment, emotional_truth } = diagnosis.missing_elements;

        const parts: string[] = [];

        if (sensory_details && sensory_details.length > 0) {
            parts.push(`  • **Sensory Details Missing:** ${sensory_details.join(', ')}`);
        }

        if (concrete_objects && concrete_objects.length > 0) {
            parts.push(`  • **Concrete Objects/Numbers Missing:** ${concrete_objects.join(', ')}`);
        }

        if (micro_moment) {
            parts.push(`  • **Grounding Moment Missing:** ${micro_moment}`);
        }

        if (emotional_truth) {
            parts.push(`  • **Emotional Truth to Show:** ${emotional_truth}`);
        }

        if (parts.length > 0) {
            missingElementsSection = `\n\n**WHAT'S MISSING (YOU MUST ADD THESE):**\n${parts.join('\n')}`;
        }
    }

    return `
**Pathology:** ${diagnosis.diagnosis}
**Symptom Type:** ${diagnosis.symptom_type}
**Specific Weakness:** "${diagnosis.specific_weakness}"
**Prescription:** ${diagnosis.prescription}${missingElementsSection}

*Analysis:* The text fails because it ${diagnosis.specific_weakness.toLowerCase()}. We must apply the prescription rigorously to resolve this.

**CRITICAL MANDATE FOR ALL SUGGESTIONS:**
Every suggestion MUST include at least 2 concrete sensory details, specific objects/numbers, or grounding micro-moments.
Abstract language like "brain kept jumping", "possibilities", "ideas" WITHOUT concrete anchors will be rejected.
The best suggestions create SCENES readers can VISUALIZE - not summaries they must imagine.
`;
}

function buildVoiceProfile(voice: VoiceFingerprint): string {
    const samples = voice.sampleSentences && voice.sampleSentences.length > 0
        ? voice.sampleSentences.map(s => `> "${s}"`).join('\n')
        : "> (No samples available)";

    return `
**Tone:** ${voice.tone}
**Cadence:** ${voice.cadence}
**Markers:** ${voice.markers.join(', ')}

**THIS PERSON'S VOICE (Study These Carefully):**
${samples}

**CRITICAL DIRECTIVE:**
Your job is NOT to make this person sound "better" or more sophisticated.
Your job is to help them sound MORE LIKE THEMSELVES.

Study the samples above and notice:
- How long are their sentences? Keep that rhythm.
- What vocabulary do they naturally use? Stay at that level.
- Do they use contractions? Fragments? Questions? Keep those patterns.
- What makes their voice distinctive? Amplify those traits.

A suggestion that sounds "polished" but doesn't sound like THEM is a failure.
`;
}

function buildReferenceLibrary(examples: any[]): string {
    return examples.map((e, i) => `
**Case Study ${i + 1}:**
*Original:* "${e.original}"
*Transformation:* "${e.fix}"
*Technique:* ${e.strategyUsed}
*Why it works:* ${e.rationale}
`).join('\n');
}

function buildStrategicDirectives(strategy: NarrativeStrategy, tier: string): string {
    return `
**OBJECTIVE:** Generate 3 distinct options to resolve the pathology.

**Option 1: The Surgical Repair (Polished Original)**
- **Goal:** Fix the diagnosed weakness (${strategy.rubricCategory}) while preserving the original sentence's core "shape".
- **Permission:** If the original shape is fundamentally broken (cliché or weak thought), you may restructure it, but keep the *intent*.
- **Standard:** Must match the "Audio Samples" in voice.

**Option 2: The Voice Amplification**
- **Goal:** Dial up the specific voice traits (e.g., if "Reflective", make it deeper; if "Punchy", make it sharper).
- **Constraint:** Do NOT use filler phrases like "I believe". Use *stylistic* amplification (sentence length, word choice).

**Option 3: The Divergent Strategy (${strategy.name})**
- **Goal:** Apply the specific strategy: **${strategy.name}**.
- **Instruction:** ${strategy.instruction}
- **Example Concept:** ${strategy.example_concept}
- **Freedom:** This option can take a new narrative angle if it serves the holistic theme.
`;
}

function buildTeachingProtocol(): string {
    // Phase 14: Use comprehensive teaching protocol
    return COMPREHENSIVE_TEACHING_PROTOCOL;
}

function buildHolisticBrief(context?: HolisticUnderstanding): string {
    if (!context) return "**No holistic context available.**";
    return `
**Central Theme:** ${context.centralTheme}
**Primary Voice:** ${context.primaryVoice}
**Narrative Thread:** ${context.narrativeThread}

*Directive:* All edits must advance this central theme. Do not introduce contradictions.
`;
}

