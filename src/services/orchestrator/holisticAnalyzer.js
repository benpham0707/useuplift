/**
 * HOLISTIC APPLICATION ANALYZER
 *
 * The "Meta-Brain" of the Admissions System.
 *
 * Goal: Simulate an elite admissions officer who doesn't just read the essay in a vacuum,
 * but reads it alongside the student's entire file (grades, activities, demographics).
 *
 * Now enhanced to drive the "Profile Insights" UI with rich, candidate-based generation.
 */
import { callClaude } from '@/lib/llm/claude';
export class HolisticAnalyzer {
    static async analyze(essayText, profile, essayAnalysis) {
        console.log('[HolisticAnalyzer] Starting deep cross-reference analysis...');
        const systemPrompt = `You are a Senior Admissions Officer at a top-tier university (Stanford/Harvard/UC Berkeley).
    
    Your job is to VALIDATE the application package and provide STRATEGIC INSIGHTS.
    You have the student's **Profile** (grades, activities, demographics) and their **Essay**.
    
    # CORE TASKS
    
    1. **VALIDATE (Integrity Check)**:
       - Cross-reference essay claims with the Activity List.
       - Flag discrepancies (e.g., Essay says "Founder", List says "Member").
       
    2. **SYNTHESIZE (Narrative Thread)**:
       - Identify the "Spine" - the cohesive story connecting activities.
       - Generate 3 candidates for the "Narrative Thread", ranked by strength.
       - **DEPTH**: Write a full paragraph (3-4 sentences), not just a blurb. Explain the connection deeply.
       
    3. **DIFFERENTIATE (What Stands Out)**:
       - Identify the "Spike" - the strongest differentiator.
       - Generate 3 candidates (e.g., "Quantifiable Impact", "Unique Intersection").
       - **DEPTH**: Go beyond the label. Explain *why* it separates them from the applicant pool.
       
    4. **CRITIQUE (What to Improve)**:
       - Identify the "Lift" - the critical gap to address.
       - Generate 3 candidates.
       - **ACTIONABLE**: Provide specific, concrete steps (e.g., "Launch a website", "Submit to X competition").
       
    5. **REVEAL (Blind Spots)**:
       - Identify "Unintended Signals" - what might the student be signaling without realizing it?
       - e.g., "You sound like you're trying too hard to impress" or "Your narrative feels disjointed."
       - Generate 3 candidates.

    6. **POSITION (Strategic Archetype)**:
       - Define the "Brand Archetype" (e.g., "Civic-Tech Builder").
       - Generate 3 candidates with rationale and tags.
       
    # RICH TEXT FORMATTING INSTRUCTION (CRITICAL)
    You MUST use the "Rich Text" structure to embed evidence. This enables the UI to show "God-mode" details on hover.
    
    **Format**: Array of strings and objects.
    - Plain string for narrative flow.
    - Object \`{ text: "highlighted phrase", details: ["Specific evidence 1", "Specific evidence 2"] }\` for tooltips.
    
    **Example**:
    [
      "Your profile is anchored by ",
      { 
        "text": "entrepreneurial grit", 
        "details": ["Launched startup in 10th grade", "Generated $5k revenue", "Pitched to VC"] 
      },
      ", which stands in contrast to the ",
      {
        "text": "standard academic path",
        "details": ["AP workload average", "No research portfolio"]
      },
      " seen in most CS applicants."
    ]
    
    **Rule**: Every insight MUST have at least 1-2 rich text highlights with specific evidence from the profile/essay.
    
    Output strictly in JSON matching the HolisticAnalysis interface.`;
        const userPrompt = `
    **STUDENT PROFILE:**
    ${JSON.stringify(profile, null, 2)}

    **ESSAY TEXT:**
    "${essayText}"

    **PREVIOUS AI ANALYSIS (For context):**
    - Prompt Type: ${essayAnalysis.metadata.promptType}
    - Voice Score: ${essayAnalysis.voice?.score || 'N/A'}
    - Hook Type: ${essayAnalysis.opening_hook?.hook_type || 'N/A'}

    **TASK:**
    Perform a holistic analysis. Generate multiple candidates for Narrative, Spike, Lift, Blind Spots, and Archetype.
    Ensure all "text" fields use the RichTextSegment format with deep, specific details in the tooltips.
    
    Return JSON matching the HolisticAnalysis interface.
    `;
        try {
            const response = await callClaude(userPrompt, {
                systemPrompt,
                model: 'claude-sonnet-4-20250514', // Use smartest model for this meta-analysis
                temperature: 0.3, // Slightly higher for creative synthesis (archetypes)
                maxTokens: 4000,
                useJsonMode: true
            });
            return response.content;
        }
        catch (error) {
            console.error('[HolisticAnalyzer] Failed:', error);
            // Return a safe fallback
            return {
                consistency_check: {
                    status: 'consistent',
                    score: 5,
                    contradictions: []
                },
                strategic_fit: {
                    status: 'aligned',
                    score: 5,
                    major_alignment_analysis: 'Analysis failed',
                    gaps: []
                },
                narrative_quality: {
                    coherence_score: 0,
                    spine: [],
                    spike: [],
                    lift: [],
                    blind_spots: []
                },
                brand_archetype: {
                    candidates: []
                },
                risk_analysis: {
                    has_red_flags: false,
                    flags: []
                }
            };
        }
    }
}
//# sourceMappingURL=holisticAnalyzer.js.map