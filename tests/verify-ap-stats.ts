/**
 * Verification script: Compare our AP stats against official College Board 2024 data
 * Covers ALL 40 AP courses offered by College Board
 */
import { AP_EXAM_STATISTICS } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/academicResearchFoundation';
import { AP_COURSES } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/academicCourseKnowledgeBase';

// Official College Board 2024 score distributions
// Source: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/2024
// Mean scores calculated from: (5*%5 + 4*%4 + 3*%3 + 2*%2 + 1*%1) / 100
const OFFICIAL: Record<string, { passRate: number; fiveRate: number; mean: number }> = {
  // ===== MATH =====
  'AP Calculus AB': { passRate: 0.644, fiveRate: 0.214, mean: 3.22 },
  'AP Calculus BC': { passRate: 0.809, fiveRate: 0.477, mean: 3.92 },
  'AP Statistics': { passRate: 0.618, fiveRate: 0.175, mean: 2.96 },
  'AP Precalculus': { passRate: 0.757, fiveRate: 0.259, mean: 3.42 },

  // ===== COMPUTER SCIENCE =====
  'AP Computer Science A': { passRate: 0.672, fiveRate: 0.256, mean: 3.18 },
  'AP Computer Science Principles': { passRate: 0.640, fiveRate: 0.109, mean: 2.90 },

  // ===== PHYSICS =====
  'AP Physics 1': { passRate: 0.473, fiveRate: 0.102, mean: 2.59 },
  'AP Physics 2': { passRate: 0.705, fiveRate: 0.191, mean: 3.20 },
  'AP Physics C: Mechanics': { passRate: 0.763, fiveRate: 0.285, mean: 3.49 },
  'AP Physics C: E&M': { passRate: 0.716, fiveRate: 0.352, mean: 3.53 },

  // ===== BIOLOGY & CHEMISTRY =====
  'AP Biology': { passRate: 0.683, fiveRate: 0.168, mean: 3.15 },
  'AP Chemistry': { passRate: 0.756, fiveRate: 0.179, mean: 3.31 },
  'AP Environmental Science': { passRate: 0.541, fiveRate: 0.092, mean: 2.80 },

  // ===== ENGLISH =====
  'AP English Language': { passRate: 0.546, fiveRate: 0.098, mean: 2.79 },
  'AP English Literature': { passRate: 0.724, fiveRate: 0.137, mean: 3.16 },

  // ===== HISTORY =====
  'AP US History': { passRate: 0.722, fiveRate: 0.128, mean: 3.22 },
  'AP World History': { passRate: 0.637, fiveRate: 0.119, mean: 3.11 },
  'AP European History': { passRate: 0.716, fiveRate: 0.131, mean: 3.23 },

  // ===== SOCIAL SCIENCE =====
  'AP Microeconomics': { passRate: 0.676, fiveRate: 0.229, mean: 3.24 },
  'AP Macroeconomics': { passRate: 0.651, fiveRate: 0.207, mean: 3.13 },
  'AP US Government': { passRate: 0.730, fiveRate: 0.243, mean: 3.38 },
  'AP Comparative Government': { passRate: 0.730, fiveRate: 0.160, mean: 3.18 },
  'AP Psychology': { passRate: 0.617, fiveRate: 0.192, mean: 2.97 },
  'AP Human Geography': { passRate: 0.562, fiveRate: 0.179, mean: 2.83 },
  'AP African American Studies': { passRate: 0.726, fiveRate: 0.142, mean: 3.22 },

  // ===== ARTS =====
  'AP Art History': { passRate: 0.627, fiveRate: 0.139, mean: 2.99 },
  'AP Music Theory': { passRate: 0.602, fiveRate: 0.190, mean: 3.01 },
  'AP 2D Art and Design': { passRate: 0.828, fiveRate: 0.112, mean: 3.31 },
  'AP 3D Art and Design': { passRate: 0.719, fiveRate: 0.062, mean: 3.04 },
  'AP Drawing': { passRate: 0.838, fiveRate: 0.151, mean: 3.42 },

  // ===== AP CAPSTONE =====
  'AP Research': { passRate: 0.861, fiveRate: 0.126, mean: 3.35 },
  'AP Seminar': { passRate: 0.857, fiveRate: 0.094, mean: 3.20 },

  // ===== WORLD LANGUAGES =====
  'AP Spanish Language': { passRate: 0.830, fiveRate: 0.212, mean: 3.54 },
  'AP Spanish Literature': { passRate: 0.670, fiveRate: 0.102, mean: 3.00 },
  'AP French Language': { passRate: 0.723, fiveRate: 0.145, mean: 3.20 },
  'AP German Language': { passRate: 0.698, fiveRate: 0.261, mean: 3.32 },
  'AP Italian Language': { passRate: 0.724, fiveRate: 0.226, mean: 3.30 },
  'AP Japanese Language': { passRate: 0.762, fiveRate: 0.491, mean: 3.68 },
  'AP Chinese Language': { passRate: 0.886, fiveRate: 0.533, mean: 4.08 },
  'AP Latin': { passRate: 0.565, fiveRate: 0.119, mean: 2.76 },
};

const totalOfficial = Object.keys(OFFICIAL).length;
console.log(`=== AP STATS VERIFICATION (${totalOfficial} courses) ===\n`);

// ===== VERIFY RESEARCH FOUNDATION (AP_EXAM_STATISTICS) =====
console.log('--- RESEARCH FOUNDATION (academicResearchFoundation.ts) ---\n');
let errors1 = 0;
let matched1 = 0;
for (const [name, official] of Object.entries(OFFICIAL)) {
  const stat = AP_EXAM_STATISTICS[name];
  if (stat === undefined) {
    console.log(`  MISSING: ${name}`);
    errors1++;
    continue;
  }

  const pDiff = Math.abs(stat.passRate.value - official.passRate);
  const fDiff = Math.abs(stat.fiveRate.value - official.fiveRate);
  const mDiff = Math.abs(stat.meanScore.value - official.mean);

  if (pDiff > 0.002 || fDiff > 0.002 || mDiff > 0.02) {
    console.log(`  MISMATCH: ${name}`);
    if (pDiff > 0.002) console.log(`    passRate: got ${stat.passRate.value}, expected ${official.passRate}`);
    if (fDiff > 0.002) console.log(`    fiveRate: got ${stat.fiveRate.value}, expected ${official.fiveRate}`);
    if (mDiff > 0.02) console.log(`    meanScore: got ${stat.meanScore.value}, expected ${official.mean}`);
    errors1++;
  } else {
    matched1++;
  }
}
console.log(`\n  Matched: ${matched1}/${totalOfficial}`);
console.log(`  Result: ${errors1 === 0 ? 'ALL STATS MATCH OFFICIAL DATA' : `${errors1} errors found`}\n`);

// ===== VERIFY COURSE KNOWLEDGE BASE (AP_COURSES) =====
console.log('--- COURSE KNOWLEDGE BASE (academicCourseKnowledgeBase.ts) ---\n');
let errors2 = 0;
let matched2 = 0;
let notInKB = 0;

// Only check courses that have full profiles (not all courses in OFFICIAL will have profiles)
for (const [name, official] of Object.entries(OFFICIAL)) {
  const course = AP_COURSES[name];
  if (course === undefined) {
    // Not an error - some courses may not have full profiles yet
    notInKB++;
    continue;
  }

  const pDiff = Math.abs(course.passRate - official.passRate);
  const fDiff = Math.abs(course.fiveRate - official.fiveRate);

  if (pDiff > 0.002 || fDiff > 0.002) {
    console.log(`  MISMATCH: ${name}`);
    if (pDiff > 0.002) console.log(`    passRate: got ${course.passRate}, expected ${official.passRate}`);
    if (fDiff > 0.002) console.log(`    fiveRate: got ${course.fiveRate}, expected ${official.fiveRate}`);
    errors2++;
  } else {
    matched2++;
  }
}
const profiledCount = totalOfficial - notInKB;
console.log(`\n  Profiled: ${profiledCount}/${totalOfficial} (${notInKB} without full profiles)`);
console.log(`  Matched: ${matched2}/${profiledCount}`);
console.log(`  Result: ${errors2 === 0 ? 'ALL PROFILED COURSES MATCH OFFICIAL DATA' : `${errors2} errors found`}\n`);

// ===== COVERAGE SUMMARY =====
console.log('=== COVERAGE SUMMARY ===\n');
const researchCount = Object.keys(AP_EXAM_STATISTICS).length;
const profileCount = Object.keys(AP_COURSES).length;
console.log(`  Research Foundation entries: ${researchCount}`);
console.log(`  Course Knowledge Base entries: ${profileCount}`);
console.log(`  Official College Board courses verified: ${totalOfficial}`);

// Check for entries in our system that aren't in OFFICIAL (shouldn't happen)
const extraResearch = Object.keys(AP_EXAM_STATISTICS).filter(k => !OFFICIAL[k]);
const extraKB = Object.keys(AP_COURSES).filter(k => !OFFICIAL[k]);
if (extraResearch.length > 0) {
  console.log(`\n  WARNING: Research Foundation has entries not in verification: ${extraResearch.join(', ')}`);
}
if (extraKB.length > 0) {
  console.log(`\n  WARNING: Knowledge Base has entries not in verification: ${extraKB.join(', ')}`);
}

// Final verdict
const totalErrors = errors1 + errors2;
console.log(`\n  FINAL: ${totalErrors === 0 ? 'ALL VERIFIED DATA IS ACCURATE' : `${totalErrors} total errors found`}`);
