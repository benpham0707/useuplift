# PHASE 2: PATTERN DETECTION ENHANCEMENT

**Status**: Ready to Begin
**Dependencies**: Phase 1 Complete ✅
**Estimated Time**: 2-3 hours
**Goal**: Create comprehensive pattern detection for all 13 dimensions across 8 PIQ types

---

## SYSTEM INTEGRITY VERIFICATION ✅

Before starting Phase 2, verified:

✅ **Full codebase compiles**: Zero TypeScript errors
✅ **Database compatible**: Uses flexible `jsonb` for dimensions (supports 9, 11, or 13)
✅ **No workshop conflicts**: PIQ and workshop systems are completely independent
✅ **Existing patterns counted**: 40 patterns across old 9 dimensions
✅ **No downstream breakage**: Only PIQ files import PIQ types

**Conclusion**: Safe to proceed. Changes are isolated to PIQ system.

---

## CURRENT STATE

### Existing PIQ Patterns (40 total)
- Opening Hook Quality: 4 patterns
- Vulnerability & Authenticity: 5 patterns
- Narrative Arc & Stakes: 5 patterns
- Specificity & Evidence: 4 patterns
- Voice Integrity: 5 patterns
- Reflection & Insight: 5 patterns
- Identity & Self-Discovery: 5 patterns
- Craft & Language Quality: 4 patterns
- Thematic Coherence: 3 patterns (deprecated - merged into Narrative Arc)

### New Dimensions Needing Patterns (4 total)
1. **Transformative Impact** - 0 patterns (need 5-6)
2. **Role Clarity & Ownership** - 0 patterns (need 5-6)
3. **Initiative & Leadership** - 0 patterns (need 5-6)
4. **Context & Circumstances** - 0 patterns (need 5-6)

### Extracurricular Workshop Patterns Available
- 50+ patterns across 11 dimensions (646 lines in `src/services/workshop/issuePatterns.ts`)
- Can reuse/adapt patterns for:
  - Transformative Impact
  - Role Clarity & Ownership
  - Initiative & Leadership
  - Specificity & Evidence (enhance existing)
  - Voice Integrity (enhance existing)

---

## PHASE 2 OBJECTIVES

### 1. Update Existing Pattern Types ✅
- Change all existing patterns from old 9 dimensions to new 13 dimensions
- Remove `thematic_coherence` patterns (3 patterns) - merge into `narrative_arc_stakes`
- Ensure all patterns use correct `PIQRubricDimension` type

### 2. Add Patterns for 4 New Dimensions
Need **20-24 new patterns** total (5-6 per dimension):

**Transformative Impact** (6 patterns):
- Generic "I learned" statements
- No before/after contrast
- Instant epiphany (not earned growth)
- Vague transformation claims
- Missing behavior change evidence
- No belief shift demonstrated

**Role Clarity & Ownership** (6 patterns):
- Vague "we" statements without "I"
- Credit ambiguity
- Passive voice hiding agency
- Title-dropping without actions
- Group achievement without individual contribution
- Missing failure ownership

**Initiative & Leadership** (6 patterns):
- Reactive vs proactive language
- Waiting for permission
- No problem identification
- Missing risk-taking
- Assigned role vs self-created opportunity
- Following instructions vs leading

**Context & Circumstances** (6 patterns):
- Missing obstacle description
- Victim narrative without agency
- No resourcefulness demonstrated
- Vague about challenges faced
- Missing resilience indicators
- "Woe is me" tone

### 3. Enhance Existing Patterns
- Add **5-10 prompt-specific pattern variations** for:
  - Opening Hook (PIQ 5 Challenge vs PIQ 2 Creative)
  - Vulnerability (PIQ 5 high emphasis vs PIQ 1 low emphasis)
  - Specificity (PIQ 3 Talent needs skill demonstration)

### 4. Validate Pattern Coverage
- Ensure all 13 dimensions have 4-6 patterns
- Verify prompt-specific patterns for PIQs 2, 5, 6 (highest specialization)
- Test pattern detection with sample essays

---

## IMPLEMENTATION PLAN

### Step 1: Read & Understand Existing Systems (30 min)
1. Read full `src/services/piq/issuePatterns.ts` (1,204 lines)
2. Read full `src/services/workshop/issuePatterns.ts` (646 lines)
3. Map overlapping patterns between systems
4. Identify reusable patterns for new dimensions

### Step 2: Update Type Definitions (15 min)
1. Update all existing 40 patterns to use new 13-dimension types
2. Migrate 3 `thematic_coherence` patterns to `narrative_arc_stakes`
3. Verify TypeScript compilation

### Step 3: Create Patterns for New Dimensions (60 min)
1. **Transformative Impact** (6 patterns)
   - Adapt from workshop patterns + create PIQ-specific ones
2. **Role Clarity & Ownership** (6 patterns)
   - Adapt from workshop patterns
3. **Initiative & Leadership** (6 patterns)
   - Adapt from workshop patterns
4. **Context & Circumstances** (6 patterns)
   - Create new PIQ-specific patterns

### Step 4: Add Prompt-Specific Variations (30 min)
1. Opening Hook variations for Challenge vs Creative
2. Vulnerability patterns for high-emphasis PIQs
3. Specificity patterns for Talent/Academic PIQs

### Step 5: Testing & Validation (15 min)
1. Verify TypeScript compilation
2. Test pattern detection with sample text
3. Validate all dimensions have 4-6 patterns
4. Check pattern severity distribution (critical/major/minor)

---

## EXPECTED OUTCOMES

### Pattern Count
- **Before**: 40 patterns (9 dimensions)
- **After**: 70-80 patterns (13 dimensions)
- **New**: 30-40 patterns created
- **Updated**: 40 patterns migrated

### Coverage
- ✅ All 13 dimensions have 4-6 patterns
- ✅ High-priority dimensions (Vulnerability, Opening Hook, Specificity) have 6+ patterns
- ✅ Prompt-specific variations for PIQs 2, 5, 6
- ✅ Severity distribution: ~30% critical, ~50% major, ~20% minor

### Code Quality
- ✅ Zero TypeScript errors
- ✅ All patterns follow same structure
- ✅ Clear fix strategies for each pattern
- ✅ Accurate estimated impact

---

## PATTERN STRUCTURE (Template)

```typescript
{
  id: 'dimension-###-pattern-name',           // Unique ID
  dimension: PIQRubricDimension,               // One of 13 dimensions
  title: 'Human-Readable Title',               // 3-5 words
  severity: 'critical' | 'major' | 'minor',    // Impact level

  triggerConditions: {
    scoreThreshold?: number,                   // Trigger if score < X
    keywordPatterns?: string[],                // Regex patterns to match
    absencePatterns?: string[],                // Missing element indicators
    customCheck?: string                       // Custom logic identifier
  },

  problemTemplate: 'What is wrong...',         // Clear problem description
  whyMattersTemplate: 'Why this hurts...',     // Impact on admissions

  fixStrategies: [
    {
      technique: 'Fix Technique Name',
      description: 'How to fix it...',
      estimatedImpact: '+X points in Dimension'
    }
    // 2-3 strategies per pattern
  ]
}
```

---

## PRIORITY PATTERNS TO CREATE

### High Priority (Critical Issues)
1. **Transformative Impact**:
   - `transform-001-generic-learned` - "I learned that..." statements
   - `transform-002-no-before-after` - Missing before/after contrast
   - `transform-003-instant-epiphany` - Unrealistic instant change

2. **Role Clarity**:
   - `role-001-vague-we-statements` - "We did X" without "I"
   - `role-002-credit-ambiguity` - Unclear who did what
   - `role-003-passive-voice-agency` - Passive voice hiding actions

3. **Initiative**:
   - `initiative-001-reactive-language` - Waiting for instructions
   - `initiative-002-no-problem-id` - No problem identification
   - `initiative-003-assigned-vs-created` - Given role vs created opportunity

4. **Context**:
   - `context-001-missing-obstacles` - No challenges described
   - `context-002-victim-narrative` - Complaint without agency
   - `context-003-no-resourcefulness` - Missing creative solutions

### Medium Priority (Major Issues)
5-10 patterns per new dimension covering common but not critical issues

### Low Priority (Polish Issues)
1-2 minor patterns per dimension for fine-tuning

---

## PROMPT-SPECIFIC PATTERNS

### PIQ 2 (Creative)
- Opening Hook: "Creative work shown without process"
- Craft & Language: "Artistic description lacks sensory detail"

### PIQ 5 (Challenge)
- Vulnerability: "Challenge described but no emotional impact shown"
- Context: "Obstacle mentioned but not explained WHY it was hard"
- Narrative Arc: "Resolution too neat for significant challenge"

### PIQ 6 (Academic)
- Fit & Trajectory: "Interest claimed but no future connection"
- Reflection: "Surface-level 'I find it interesting' without intellectual depth"

### PIQ 7 (Community)
- Initiative: "Volunteered but didn't identify the problem"
- Role Clarity: "Community improved but YOUR role unclear"

---

## VALIDATION CHECKLIST

Before completing Phase 2:

- [ ] All 40 existing patterns updated to new 13-dimension types
- [ ] 3 thematic_coherence patterns migrated to narrative_arc_stakes
- [ ] 6 Transformative Impact patterns created
- [ ] 6 Role Clarity & Ownership patterns created
- [ ] 6 Initiative & Leadership patterns created
- [ ] 6 Context & Circumstances patterns created
- [ ] 5-10 prompt-specific pattern variations added
- [ ] TypeScript compiles with zero errors
- [ ] All dimensions have 4-6 patterns minimum
- [ ] Severity distribution: ~30% critical, ~50% major, ~20% minor
- [ ] Fix strategies provided for all patterns (2-3 per pattern)
- [ ] Estimated impact included for all fix strategies
- [ ] Pattern IDs follow naming convention: `dimension-###-description`

---

## RISK MITIGATION

### Risk 1: Breaking Existing Patterns
**Mitigation**: Only change dimension names, keep all logic identical
**Validation**: Test pattern detection with sample text before/after

### Risk 2: Type Mismatches
**Mitigation**: Update types.ts first, then update all references
**Validation**: Run `npx tsc --noEmit` after each major change

### Risk 3: Pattern Overlap
**Mitigation**: Review pattern triggers to avoid duplicates
**Validation**: Check that each pattern has unique trigger conditions

### Risk 4: Missing Coverage
**Mitigation**: Create coverage matrix (13 dimensions × severity levels)
**Validation**: Verify each dimension has at least 1 critical, 2 major, 1 minor pattern

---

## SUCCESS METRICS

**Pattern Quality**:
- ✅ Clear problem descriptions (no vague language)
- ✅ Specific fix strategies (actionable, not generic)
- ✅ Accurate estimated impact (based on dimension weights)
- ✅ Appropriate severity levels (critical issues are truly critical)

**Coverage**:
- ✅ 70-80 total patterns (up from 40)
- ✅ All 13 dimensions covered
- ✅ Prompt-specific variations for high-specialization PIQs

**System Health**:
- ✅ Zero TypeScript errors
- ✅ No conflicts with workshop system
- ✅ Database schema compatible
- ✅ Pattern detection performant (<100ms per essay)

---

## NEXT PHASE PREVIEW

**Phase 3: Teaching Examples Expansion** (~2-3 hours)
- Merge existing 509 lines of PIQ teaching examples
- Add examples for 4 new dimensions
- Expand from ~40 examples to 100-150 examples
- Ensure weak→strong comparative pairs for all pattern types
- Add prompt-specific examples

---

## READY TO BEGIN

All prerequisites met:
✅ Phase 1 complete (types, rubric, weights, prompts)
✅ System integrity verified
✅ No breaking changes to other systems
✅ Clear implementation plan
✅ Validation checklist ready

**Estimated completion**: 2-3 hours
**Output**: 70-80 comprehensive patterns for all 13 dimensions
**Next step**: Begin Step 1 (Read & Understand Existing Systems)
