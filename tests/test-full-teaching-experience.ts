/**
 * Test Full Teaching Experience
 *
 * Showcases the complete teaching flow from issue detection to chat handoff:
 *
 * 1. Issue Detection → Symptom type identified
 * 2. Research Context → WHY/HOW/EXAMPLES attached
 * 3. Formatted Guidance → Step-by-step digestible format
 * 4. Chat Handoff → Context for personalized application
 *
 * This test demonstrates what a student would actually see and how
 * they would navigate from learning to applying.
 */

import { teachingGuidancePresenter } from '../src/services/commonAppWorkshop/services/teachingGuidancePresenter';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

// ============================================================================
// MOCK ISSUES (Simulating Stage 1B diagnosis output)
// ============================================================================

const MOCK_ISSUES: CriticalIssue[] = [
  {
    issue_number: 1,
    quote: 'I have always been passionate about learning and pushing myself to achieve my goals.',
    location: 'Opening paragraph, lines 1-2',
    problem: 'Generic claim of passion without concrete evidence or specific moment',
    symptom_type: 'telling_not_showing',
    diagnosis: 'The student TELLS about passion without SHOWING a moment where that passion was visible through behavior',
    prescription: 'Replace with a specific scene showing curiosity in action - what did you actually DO that shows passion?',
    missing_elements: {
      sensory_details: [
        'What did your learning environment look like?',
        'What sounds surrounded you?',
        'What physical sensations did you feel?'
      ],
      concrete_objects: [
        'Specific book titles or subjects',
        'Names of teachers or mentors',
        'Numbers: how many hours, how many attempts'
      ],
      micro_moment: 'The exact moment when your passion became visible - staying up late, forgetting to eat, losing track of time',
      emotional_truth: 'Show frustration or exhilaration through action, not by naming the emotion'
    },
    relevant_concept: 'IV must be visible through behavior',
    relevant_evidence: [],
    socratic_questions: ['When did you lose track of time learning?', 'What did you forget to do because you were so absorbed?'],
    college_value_impacted: 'Intellectual Vitality'
  },
  {
    issue_number: 2,
    quote: 'This transformative experience profoundly impacted my multifaceted perspective on community service.',
    location: 'Second paragraph, line 5',
    problem: 'AI-convergence language signals inauthenticity and over-polishing',
    symptom_type: 'ai_convergence',
    diagnosis: 'Vocabulary sounds generated, not authentic to a 17-year-old voice',
    prescription: 'Replace elevated vocabulary with natural speech - say it how you would to a friend',
    missing_elements: {
      concrete_objects: ['What specifically happened?', 'Where were you?', 'Who was there?'],
      micro_moment: 'A single moment, not a summary'
    },
    relevant_concept: 'Voice authenticity',
    relevant_evidence: [],
    socratic_questions: ['Would you say this out loud to a friend?', 'How would you describe this in a text message?'],
    college_value_impacted: 'Authenticity'
  },
  {
    issue_number: 3,
    quote: 'Through this experience, I learned that hard work always pays off and I became a completely different person.',
    location: 'Conclusion, final paragraph',
    problem: 'Premature resolution - forcing neat conclusion that undermines complexity',
    symptom_type: 'premature_resolution',
    diagnosis: 'Forced lesson undermines the authentic complexity of real growth',
    prescription: 'End with ongoing questions or honest uncertainty rather than neat takeaway',
    missing_elements: {
      emotional_truth: 'What questions remain unanswered?'
    },
    relevant_concept: 'Complexity over neat endings',
    relevant_evidence: [],
    socratic_questions: ['What are you still figuring out?', 'Where do you still struggle?'],
    college_value_impacted: 'Intellectual Vitality'
  }
];

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function displaySeparator(char: string = '=', length: number = 80): void {
  console.log(char.repeat(length));
}

function displayHeader(title: string): void {
  console.log('');
  displaySeparator();
  console.log(title);
  displaySeparator();
  console.log('');
}

function displaySubHeader(title: string): void {
  console.log('');
  console.log(`  ${title}`);
  console.log('  ' + '-'.repeat(title.length));
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest() {
  console.log('');
  displaySeparator('*');
  console.log('  FULL TEACHING EXPERIENCE SHOWCASE');
  console.log('  Demonstrating the complete student learning journey');
  displaySeparator('*');

  let allPassed = true;

  for (const issue of MOCK_ISSUES) {
    displayHeader(`ISSUE ${issue.issue_number}: ${issue.symptom_type.toUpperCase()}`);

    // Get formatted teaching guidance
    const teachingPackage = teachingGuidancePresenter.formatIssueForTeaching(issue, 'Stanford');
    const guidance = teachingPackage.formatted_guidance;

    // ========================================
    // SECTION 1: WHAT'S WRONG (The Problem)
    // ========================================
    displaySubHeader('🔍 WHAT\'S WRONG');
    console.log('');
    console.log(`  Title: ${guidance.issue_title}`);
    console.log('');
    console.log('  Your text:');
    console.log(`    "${guidance.student_quote}"`);
    console.log(`    Location: ${guidance.student_quote_location}`);
    console.log('');

    // ========================================
    // SECTION 2: WHY THIS MATTERS (The Insight)
    // ========================================
    displaySubHeader('💡 WHY THIS MATTERS');
    console.log('');
    console.log(`  ${guidance.why_this_matters.headline}`);
    console.log('');
    console.log('  Explanation:');
    // Word-wrap the explanation
    const explanation = guidance.why_this_matters.explanation;
    const words = explanation.split(' ');
    let line = '    ';
    for (const word of words) {
      if (line.length + word.length > 75) {
        console.log(line);
        line = '    ' + word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) console.log(line);

    if (guidance.why_this_matters.admissions_quote) {
      console.log('');
      console.log('  📣 Admissions Insight:');
      console.log(`    "${guidance.why_this_matters.admissions_quote}"`);
      if (guidance.why_this_matters.admissions_source) {
        console.log(`    - ${guidance.why_this_matters.admissions_source}`);
      }
    }
    console.log('');

    // ========================================
    // SECTION 3: HOW TO FIX IT (Step by Step)
    // ========================================
    displaySubHeader('🛠️ HOW TO FIX IT (Step-by-Step)');
    console.log('');
    console.log(`  ⏱️ Estimated time: ${guidance.estimated_time}`);
    console.log(`  📊 Difficulty: ${guidance.difficulty}`);
    console.log('');

    for (const step of guidance.step_by_step) {
      console.log(`  Step ${step.step_number}: ${step.technique_name}`);
      console.log('  ' + '─'.repeat(40));
      console.log(`    ${step.instruction}`);
      if (step.tip) {
        console.log('');
        console.log(`    💡 Tip: ${step.tip}`);
      }
      if (step.common_mistake) {
        console.log(`    ⚠️  Avoid: ${step.common_mistake}`);
      }
      console.log('');
    }

    // ========================================
    // SECTION 4: EXAMPLES (Before/After)
    // ========================================
    if (guidance.examples.length > 0) {
      displaySubHeader('📝 EXAMPLES');
      console.log('');

      for (const example of guidance.examples) {
        console.log(`  ${example.title}`);
        console.log('');
        console.log('  BEFORE (❌ problematic):');
        console.log(`    "${example.before.text}"`);
        console.log(`    Issue: ${example.before.issue_highlighted}`);
        console.log('');
        console.log('  AFTER (✅ improved):');
        console.log(`    "${example.after.text}"`);
        console.log(`    Improvement: ${example.after.improvement_highlighted}`);
        console.log('');
        console.log(`  Principle: ${example.principle}`);
        console.log('');
        console.log('  Why it works:');
        const whyWords = example.why_it_works.split(' ');
        let whyLine = '    ';
        for (const word of whyWords) {
          if (whyLine.length + word.length > 75) {
            console.log(whyLine);
            whyLine = '    ' + word + ' ';
          } else {
            whyLine += word + ' ';
          }
        }
        if (whyLine.trim()) console.log(whyLine);
        console.log('');
      }
    }

    // ========================================
    // SECTION 5: COLLEGE-SPECIFIC NOTE
    // ========================================
    if (guidance.college_specific) {
      displaySubHeader('🏛️ STANFORD-SPECIFIC INSIGHT');
      console.log('');
      console.log(`    ${guidance.college_specific.insight}`);
      if (guidance.college_specific.source) {
        console.log(`    - ${guidance.college_specific.source}`);
      }
      console.log('');
    }

    // ========================================
    // SECTION 6: APPLY TO YOUR ESSAY (Chat Handoff)
    // ========================================
    displaySubHeader('💬 APPLY THIS TO YOUR ESSAY');
    console.log('');
    console.log('  Ready to improve your essay? Start a guided conversation:');
    console.log('');
    console.log('  ┌' + '─'.repeat(68) + '┐');
    console.log('  │ SUGGESTED PROMPT:                                                  │');
    console.log('  │                                                                    │');

    // Word-wrap the suggested prompt
    const prompt = guidance.apply_to_my_essay.suggested_user_prompt;
    const promptWords = prompt.split(' ');
    let promptLine = '';
    const promptLines: string[] = [];
    for (const word of promptWords) {
      if (promptLine.length + word.length > 64) {
        promptLines.push(promptLine);
        promptLine = word + ' ';
      } else {
        promptLine += word + ' ';
      }
    }
    if (promptLine.trim()) promptLines.push(promptLine);

    for (const pl of promptLines) {
      const padded = pl.padEnd(66);
      console.log(`  │ "${padded}" │`);
    }
    console.log('  │                                                                    │');
    console.log('  └' + '─'.repeat(68) + '┘');
    console.log('');

    console.log('  What the coach will help you with:');
    console.log(`    • Technique: ${guidance.apply_to_my_essay.technique_name}`);
    console.log(`    • Goal: ${guidance.apply_to_my_essay.expected_outcome}`);
    console.log('');
    console.log('  Key principles to follow:');
    for (const principle of guidance.apply_to_my_essay.principles_to_follow.slice(0, 2)) {
      console.log(`    ✓ ${principle}`);
    }
    console.log('');
    console.log('  Pitfalls to avoid:');
    for (const pitfall of guidance.apply_to_my_essay.pitfalls_to_avoid.slice(0, 2)) {
      console.log(`    ✗ ${pitfall}`);
    }
    console.log('');

    if (guidance.apply_to_my_essay.reference_transformation) {
      console.log('  Reference example (for the coach):');
      console.log(`    Before: "${guidance.apply_to_my_essay.reference_transformation.before.substring(0, 50)}..."`);
      console.log(`    After:  "${guidance.apply_to_my_essay.reference_transformation.after.substring(0, 50)}..."`);
      console.log('');
    }

    // ========================================
    // VALIDATION
    // ========================================
    const hasWhySection = guidance.why_this_matters.headline.length > 10;
    const hasSteps = guidance.step_by_step.length >= 3;
    const hasExamples = guidance.examples.length > 0;
    const hasChatHandoff = guidance.apply_to_my_essay.system_context.length > 100;

    if (!hasWhySection || !hasSteps || !hasExamples || !hasChatHandoff) {
      console.log('  ⚠️  VALIDATION ISSUES:');
      if (!hasWhySection) console.log('    - Missing WHY section');
      if (!hasSteps) console.log('    - Missing step-by-step guidance');
      if (!hasExamples) console.log('    - Missing examples');
      if (!hasChatHandoff) console.log('    - Missing chat handoff context');
      allPassed = false;
    }
  }

  // ========================================
  // SUMMARY
  // ========================================
  displayHeader('SUMMARY');

  console.log('  Teaching Experience Components:');
  console.log('');
  console.log('  1. WHAT\'S WRONG    → Identified issue with student\'s text');
  console.log('  2. WHY IT MATTERS  → Research-backed explanation + AO quotes');
  console.log('  3. HOW TO FIX IT   → Step-by-step guidance with techniques');
  console.log('  4. EXAMPLES        → Before/after transformations');
  console.log('  5. COLLEGE INSIGHT → Institution-specific guidance');
  console.log('  6. APPLY IT        → Chat handoff for personalized coaching');
  console.log('');

  if (allPassed) {
    console.log('  ✅ ALL TEACHING PACKAGES COMPLETE');
    console.log('');
    console.log('  Student Journey:');
    console.log('    1. See issue highlighted in their essay');
    console.log('    2. Understand WHY it matters (admissions perspective)');
    console.log('    3. Follow step-by-step technique');
    console.log('    4. Study before/after examples');
    console.log('    5. Click "Apply to My Essay" → Chat takes over');
    console.log('    6. Chat coaches them through applying technique');
    console.log('');
    console.log('  Knowledge Bridge: OPERATIONAL');
    console.log('    Detection → Understanding → Technique → Application');
  } else {
    console.log('  ❌ SOME TEACHING PACKAGES INCOMPLETE');
    process.exit(1);
  }

  // Display chat handoff context for first issue (for developers)
  displayHeader('DEVELOPER: CHAT HANDOFF CONTEXT (Issue 1)');
  const firstPackage = teachingGuidancePresenter.formatIssueForTeaching(MOCK_ISSUES[0]);
  console.log('');
  console.log('System context passed to chat:');
  console.log('');
  console.log(firstPackage.formatted_guidance.apply_to_my_essay.system_context);
  console.log('');
}

runTest().catch(console.error);
