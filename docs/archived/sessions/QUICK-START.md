# 🚀 Quick Start Guide - Elite Narrative System

## 📋 Prerequisites

1. **Node.js** installed (v18 or higher)
2. **Environment variables** configured:
   ```bash
   cp .env.example .env
   # Add your Anthropic API key to .env:
   ANTHROPIC_API_KEY=your_key_here
   ```

3. **Dependencies** installed:
   ```bash
   npm install
   ```

---

## 🎯 What This System Does

Takes student extracurricular descriptions from:
- ❌ **Resume bullets** (10-20/100): "As Secretary General, I organized committees..."
- ❌ **Weak narratives** (40-50/100): Generic stories without emotion or specificity

And transforms them to:
- ✅ **UCLA/Top UC competitive** (70+/100): Authentic voice, vulnerability, dialogue
- 🎯 **Harvard/Stanford competitive** (85+/100, in progress): + literary sophistication

---

## ⚡ Run the Demos (2 minutes)

### 1. **Analysis Demo** - See how the 3-layer system works

```bash
npx tsx tests/comprehensive-analysis-demo.ts
```

**What you'll see:**
- Authenticity detection (robotic vs. conversational voice)
- Elite pattern analysis (vulnerability, dialogue, community transformation)
- Literary sophistication (extended metaphor, structural innovation, rhythmic prose)
- Combined scoring (0-100 scale)

---

### 2. **Generation Demo** - See transformation in action

```bash
npx tsx tests/generation-demo.ts
```

**What you'll see:**
- **Test 1**: Transform weak Model UN resume bullet → narrative with dialogue
- **Test 2**: Generate Robotics essay from scratch with 5 iterations
- Iteration-by-iteration score improvements
- Learning system identifying and fixing gaps

**Expected output:**
```
TEST 1: TRANSFORMING WEAK ESSAY
Original: 17/100 (resume bullet)
Transformed: 50/100 (+33 points)

TEST 2: GENERATE FROM SCRATCH
Iteration 1: 42/100 (baseline)
Iteration 2: 62/100 (+20 points)
Iteration 4: 69/100 (best result)
```

---

## 📊 Understanding the Scoring

### **Three-Layer Analysis:**

#### 1. **Authenticity** (20% of final score)
- **0-10 scale**: Conversational vs. essay voice
- **Green flags**: Questions, fragments, dialogue, asides
- **Red flags**: "I used to think...", "this taught me", forced sensory details
- **Target**: 7+/10 (conversational voice)

#### 2. **Elite Patterns** (40% of final score)
- **0-100 scale**: 7 advanced narrative techniques
- Detects: Vulnerability, dialogue, community transformation, quantified impact
- **Tiers**:
  - Tier 1 (75-100): Harvard/Stanford level
  - Tier 2 (60-74): Top UC/Ivy competitive
  - Tier 3 (40-59): UC competitive
  - Tier 4 (0-39): Needs major work
- **Target**: 75+/100 (Tier 1)

#### 3. **Literary Sophistication** (40% of final score)
- **0-100 scale**: 10 advanced writing techniques
- Detects: Extended metaphor, structural innovation, rhythmic prose, sensory immersion
- **Tiers**:
  - S (95-100): Elite literary craft
  - A (85-94): Strong literary craft
  - B (70-84): Good writing
  - C (<70): Limited craft
- **Target**: 70+/100 (Tier B minimum)

### **Combined Score Formula:**
```
Combined = (Authenticity × 0.2) + (Elite Patterns × 0.4) + (Literary Soph × 0.4)
```

**Tier Thresholds:**
- **85-100**: Harvard/Stanford/MIT (Tier A/S)
- **70-84**: UCLA/Top UCs (Tier B)
- **60-69**: UC-Competitive (Tier C)
- **<60**: Needs significant work

---

## 🎓 Using the System

### **Option 1: Analyze Existing Essay**

```typescript
import { analyzeExtracurricularEntry } from './src/core/analysis/engine';
import { analyzeAuthenticity } from './src/core/analysis/features/authenticityDetector';
import { analyzeElitePatterns } from './src/core/analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from './src/core/analysis/features/literarySophisticationDetector';

const essay = `Your extracurricular description here...`;

// Full 3-layer analysis
const authenticity = analyzeAuthenticity(essay);
const elitePatterns = analyzeElitePatterns(essay);
const literary = analyzeLiterarySophistication(essay);

// Calculate combined score
const combined =
  (authenticity.authenticity_score * 10 * 0.2) +
  (elitePatterns.overallScore * 0.4) +
  (literary.overallScore * 0.4);

console.log(`Combined Score: ${combined}/100`);
console.log(`Authenticity: ${authenticity.authenticity_score}/10 (${authenticity.voice_type})`);
console.log(`Elite Patterns: ${elitePatterns.overallScore}/100 (Tier ${elitePatterns.tier})`);
console.log(`Literary: ${literary.overallScore}/100 (Tier ${literary.tier})`);
```

---

### **Option 2: Transform Weak Essay**

```typescript
import { transformEssay } from './src/core/generation/essayGenerator';
import type { GenerationProfile } from './src/core/generation/essayGenerator';

const weakEssay = `As Secretary General, I organized committees and led the team to over 15 conferences...`;

const profile: GenerationProfile = {
  studentVoice: 'conversational',  // or 'formal', 'quirky', 'introspective'
  riskTolerance: 'medium',  // or 'low', 'high'
  academicStrength: 'strong',

  activityType: 'academic',
  role: 'Model UN Secretary General',
  duration: 'September 2022 – June 2024',
  hoursPerWeek: 10,

  achievements: [
    'Led team to 15+ conferences',
    '90% award rate',
    'Club won distinction at NHSMUN',
  ],

  challenges: [
    'Delegate dropped out 2 hours before conference',
    'Had to teach replacement everything in limited time',
  ],

  relationships: ['Co-chair Sarah', 'Team of 12 delegates'],

  impact: [
    'Created emergency training system',
    'System continued after graduation',
  ],

  targetTier: 1,  // 1=Harvard/Stanford, 2=Top UC, 3=UC-competitive
  literaryTechniques: ['inMediasRes', 'extendedMetaphor'],
  avoidClichés: true,
};

const result = await transformEssay(weakEssay, profile);

console.log(`Transformed Essay:\n${result.essay}\n`);
console.log(`Scores: ${result.combinedScore}/100`);
console.log(`Strengths: ${result.strengths.slice(0, 3).join(', ')}`);
console.log(`Gaps: ${result.gaps.slice(0, 3).join(', ')}`);
```

---

### **Option 3: Generate from Scratch with Iterative Improvement**

```typescript
import { generateWithIterativeImprovement } from './src/core/generation/iterativeImprovement';
import type { GenerationProfile } from './src/core/generation/essayGenerator';

const profile: GenerationProfile = {
  studentVoice: 'quirky',
  riskTolerance: 'high',
  academicStrength: 'strong',

  activityType: 'academic',
  role: 'Robotics Team Lead - Vision Systems',
  duration: 'September 2022 – Present',
  hoursPerWeek: 15,

  achievements: [
    'Developed autonomous vision system',
    'Team qualified for regionals',
  ],

  challenges: [
    'Robot failed all tests week before competition',
    'Stayed up 3 nights debugging',
  ],

  relationships: ['Dad (mentor)', 'Sarah (mechanical lead)'],

  impact: [
    'Robot performed perfectly at competition',
    'Created debugging guide for future years',
  ],

  targetTier: 1,
  literaryTechniques: ['dualScene', 'extendedMetaphor'],
  avoidClichés: true,
};

const result = await generateWithIterativeImprovement(
  profile,
  5,   // max iterations
  85   // target score
);

console.log(`Final Essay (Iteration ${result.iteration}):\n${result.essay}\n`);
console.log(`Final Score: ${result.combinedScore}/100`);
console.log(`\nIteration History:`);
result.iterationHistory.forEach((iter, i) => {
  console.log(`  ${i + 1}. Score: ${iter.combinedScore}/100`);
});
```

---

## 🎨 Generation Profile Options

### **Student Voice:**
- `'formal'`: Traditional, professional tone
- `'conversational'`: Natural, like talking to a friend (recommended)
- `'quirky'`: Playful, unique personality
- `'introspective'`: Thoughtful, philosophical

### **Risk Tolerance:**
- `'low'`: Safe choices, traditional structure
- `'medium'`: Some creativity, balanced approach (recommended)
- `'high'`: Bold techniques (satire, perspective shifts)

### **Literary Techniques:**
Available options:
```typescript
'extendedMetaphor'     // Central image sustained throughout
'inMediasRes'          // Start with action/dialogue
'dualScene'            // Two contrasting scenes/moments
'montage'              // Organized around object/list
'definitionOpening'    // Begin with term definition
'perspectiveShift'     // Third-person → first-person reveal
'philosophicalInquiry' // Opens with questions
'satiricalTone'        // Hyperbolic satire (high risk!)
```

**Recommended combinations:**
- **Safe + Strong**: `['inMediasRes', 'extendedMetaphor']`
- **Creative + Bold**: `['dualScene', 'perspectiveShift']`
- **Intellectual**: `['definitionOpening', 'philosophicalInquiry']`

---

## 📈 Interpreting Results

### **Good Results:**
```
Combined Score: 73/100
Authenticity: 8.6/10 (conversational) ✅
Elite Patterns: 84/100 (Tier 2) ✅
Literary: 56.5/100 (Tier C) ⚠️

Strengths:
✓ Authentic vulnerability (5 markers)
✓ Uses dialogue to create immediacy
✓ Shows community transformation
```

**What this means:**
- Strong narrative foundation (authenticity + elite patterns)
- Ready for UCLA/Top UCs
- Needs literary craft improvement for Harvard/Stanford

**How to improve:**
- Add sentence variety (short + long)
- Strengthen extended metaphor
- Include perspective shift

---

### **Needs Work:**
```
Combined Score: 42/100
Authenticity: 6.1/10 (essay) ⚠️
Elite Patterns: 17/100 (Tier 4) ❌
Literary: 28.5/100 (Tier C) ❌

Gaps:
• Sounds manufactured, not authentic
• No vulnerability or emotional stakes
• No quoted dialogue
• Missing community transformation
```

**What this means:**
- Resume bullet format, not narrative
- Needs complete transformation

**How to improve:**
- Run `transformEssay()` with detailed profile
- Use iterative improvement (5 iterations)
- Focus on: vulnerability, dialogue, specific moments

---

## 🔧 Troubleshooting

### **"API key not found"**
```bash
# Make sure .env file exists and contains:
ANTHROPIC_API_KEY=sk-ant-...

# Then restart your terminal/IDE
```

### **"Module not found" errors**
```bash
npm install
# If using TypeScript:
npx tsx --version  # Should be 4.0+
```

### **Low scores on good content**
- Check that detectors are up to date (recent bug fixes improved accuracy)
- Run `npx tsx tests/quick-analysis-test.ts` to validate
- See [CURRENT-STATUS.md](./CURRENT-STATUS.md) for known issues

### **Generation not hitting target score**
- Increase `maxIterations` (try 7-10 instead of 5)
- Lower `targetScore` temporarily (try 75 instead of 85)
- Check that profile has detailed `challenges`, `relationships`, and `impact`
- Review [SESSION-SUMMARY.md](./SESSION-SUMMARY.md) for performance expectations

---

## 📚 Documentation

For deeper understanding:

1. **[SYSTEM-README.md](./SYSTEM-README.md)** - Complete system overview
2. **[CURRENT-STATUS.md](./CURRENT-STATUS.md)** - Current capabilities and roadmap
3. **[SESSION-SUMMARY.md](./SESSION-SUMMARY.md)** - Recent improvements and bug fixes
4. **[elite-patterns-2025.md](./elite-patterns-2025.md)** - Elite narrative techniques explained
5. **[literary-sophistication-analysis.md](./literary-sophistication-analysis.md)** - Literary techniques breakdown
6. **[GENERATION-SYSTEM-COMPLETE.md](./GENERATION-SYSTEM-COMPLETE.md)** - Generation architecture details

---

## 🎯 Expected Performance

### **Current System:**
- **Weak → Strong transformation**: +30-40 points
- **From-scratch generation**: 42 → 69/100 over 4-5 iterations
- **Authenticity preservation**: 8.6/10 consistently
- **Best tier achieved**: B (UCLA/Top UCs, 70-84/100)

### **With Profile Optimization:**
If you provide detailed profiles with:
- Specific challenges (physical symptoms, named emotions)
- Real dialogue (actual quotes from conversations)
- Quantified impact (numbers + named individuals)
- Community transformation (before/after states)

**You can expect:**
- 70-75/100 consistently
- UCLA/Top UC competitive tier
- Authentic voice (8+/10)
- Elite patterns (75-85/100)

---

## 🚀 Next Steps

1. **Run the demos** to see the system in action
   ```bash
   npx tsx tests/generation-demo.ts
   ```

2. **Try analyzing your own content**
   - Copy code from "Option 1: Analyze Existing Essay"
   - Replace with your essay text
   - See scores and feedback

3. **Generate your first transformation**
   - Use "Option 2: Transform Weak Essay"
   - Fill in your profile details
   - Run and review results

4. **Iterate for improvement**
   - Use "Option 3: Generate from Scratch"
   - Set `maxIterations: 5-7`
   - Set `targetScore: 75` (realistic) or `85` (ambitious)

---

## 💡 Pro Tips

1. **Provide detailed profiles**: The more specific your challenges, relationships, and impact, the better the generation
2. **Start with transformation**: If you have existing text, `transformEssay()` is faster than from-scratch
3. **Review iteration history**: Check which iteration scored best, not just the final one
4. **Use conversational voice**: Unless student is genuinely formal, choose `'conversational'`
5. **Include vulnerability**: System works best when profile includes specific fears, doubts, or failures
6. **Name real people**: Include actual names in `relationships` array for human element
7. **Quantify impact**: Add specific numbers to `achievements` and `impact` arrays

---

*Ready to transform student narratives from resume bullets to Harvard-competitive stories!*

**Quick Links:**
- [System Overview](./SYSTEM-README.md)
- [Current Status](./CURRENT-STATUS.md)
- [Session Summary](./SESSION-SUMMARY.md)
- [Elite Patterns Guide](./elite-patterns-2025.md)
