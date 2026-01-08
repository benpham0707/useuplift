# College Overlay Phase 2 - Quick Handoff Document

**Date**: January 3, 2026
**For**: Continuation in new chat session

---

## TL;DR

**What We Built**: Two-stage architecture that preserves universal quality (Phase 1 ✅)

**What We Need**: Surgical enhancements that add college-specific details without regenerating (Phase 2 🟡)

**Current Problem**: System preserves text 100% but doesn't make targeted improvements

**Goal**: Allow surgical additions (e.g., "study bioethics" → "study bioethics through Stanford's Program in Ethics in Society") while preventing regeneration

---

## Key Context

### Phase 1 (COMPLETE ✅)

**Architecture**:
```
generateSuggestions(with college) →
  ├─ Stage 2A: Generate universal (NO college)
  └─ Stage 2B: Enhance (PRESERVE text, enhance rationale)
```

**Files**:
- `src/services/commonAppWorkshop/services/collegeOverlayEnhancer.ts` (enhancement service)
- `src/services/commonAppWorkshop/services/typeSpecificSuggestionService.ts` (orchestrator)

**What Works**:
- ✅ 100% text preservation (no regeneration)
- ✅ Rationale enhanced with college context
- ✅ Red/green flag detection

**What Doesn't**:
- ❌ No improvements to suggestion TEXT
- ❌ Misses opportunities for targeted college details

### Phase 2 (NEEDED 🟡)

**Goal**: Make surgical improvements to suggestion text

**Good Enhancement**:
```
Universal: "study bioethics"
Enhanced: "study bioethics through Stanford's Program in Ethics in Society"
✅ Added specific program (surgical)
✅ Preserved voice and message
```

**Bad Enhancement** (reject these):
```
Universal: "I want to study bioethics..."
Bad: "Stanford's bioethics program excites me..."
❌ Regenerated (not surgical)
❌ Changed voice
```

---

## Implementation Tasks

### Task 1: Update Enhancement Prompt
**File**: `collegeOverlayEnhancer.ts` line 189-250

**Change**: `buildEnhancedRationale()` → `buildTargetedEnhancement()`

**New Prompt Logic**:
```
You are making SURGICAL enhancements for {college}.

RULES:
1. Make MINIMAL changes - only add specific program/resource names
2. PRESERVE voice, core message, quality
3. DO NOT rewrite - only targeted additions
4. If no enhancement possible, return unchanged

UNIVERSAL: "{text}"
COLLEGE PROGRAMS: {stanford.specific_resources.programs}

OUTPUT:
{
  "enhanced_text": "...",
  "changes_made": [{
    "original": "...",
    "enhanced": "...",
    "reason": "..."
  }],
  "preservation_check": {
    "voice_preserved": true,
    "core_message_preserved": true,
    "quality_improved": true
  }
}
```

### Task 2: Add Validation Layer
**File**: `collegeOverlayEnhancer.ts` (new methods)

**Add**:
```typescript
validateEnhancement(universal, enhanced, college) {
  // Check 1: Voice preserved?
  const voicePreserved = checkVoicePreservation(...);

  // Check 2: Core message preserved?
  const corePreserved = checkCoreMessage(...);

  // Check 3: Quality improved?
  const qualityImproved = assessQuality(...);

  // Return enhanced if all pass, universal if not
  return {
    use_enhanced: voicePreserved && corePreserved && qualityImproved,
    fallback_to_universal: !allPassed
  };
}
```

### Task 3: Add College Data
**Files**: `src/services/commonAppWorkshop/data/stanford.ts` (and others)

**Add**:
```typescript
specific_resources: {
  programs: [
    {
      name: "Program in Ethics in Society",
      relevant_for: ["bioethics", "ethics"]
    }
  ],
  faculty: [
    {
      name: "Professor Hank Greely",
      research_areas: ["bioethics", "CRISPR"]
    }
  ]
}
```

### Task 4: Update Enhancement Flow
**File**: `collegeOverlayEnhancer.ts` line 117-187

**Change**:
```typescript
// OLD
const enhancedRationale = await buildEnhancedRationale(...);
return {
  text: universal.text, // EXACT COPY
  rationale: enhancedRationale
};

// NEW
const enhancement = await buildTargetedEnhancement(...);
const validation = validateEnhancement(universal, enhancement);

return {
  text: validation.use_enhanced
    ? enhancement.enhanced_text
    : universal.text,
  rationale: enhancement.enhanced_rationale,
  changes_made: enhancement.changes_made,
  validation_result: validation
};
```

### Task 5: Test
**Create**: `tests/test-targeted-enhancement.ts`

**Test Cases**:
1. Surgical addition works (add program name)
2. Bad enhancement rejected (regeneration)
3. Voice preservation validated
4. No enhancement when already optimal

---

## Critical Principles

### ✅ DO
- Make surgical additions (program names, specific resources)
- Preserve voice 100%
- Preserve core message 100%
- Fall back to universal if enhancement fails validation
- Add specific details only (not generic)

### ❌ DON'T
- Rewrite suggestions
- Change voice
- Add generic flattery
- Fabricate details not in college data
- Degrade quality

---

## Testing Examples

### Test 1: Good Enhancement
```typescript
{
  universal: "study bioethics at the intersection of science and philosophy",
  college: "Stanford",
  expected: "study bioethics through Stanford's Program in Ethics in Society at the intersection of science and philosophy",
  validation: { use_enhanced: true }
}
```

### Test 2: Reject Regeneration
```typescript
{
  universal: "I want to study bioethics because...",
  college: "Stanford",
  bad_attempt: "Stanford's bioethics program excites me...",
  validation: {
    voice_preserved: false,
    use_enhanced: false // Fallback to universal
  }
}
```

### Test 3: No Change Needed
```typescript
{
  universal: "work with Professor Greely at Stanford's Program in Ethics in Society",
  expected: "(unchanged - already specific)",
  validation: { use_enhanced: false }
}
```

---

## Success Criteria

Phase 2 complete when:
- [ ] 80%+ enhancements add genuine value
- [ ] 0% regeneration rate
- [ ] 100% voice preservation
- [ ] Validation rejects bad enhancements
- [ ] Tests pass with real examples

---

## Quick Start Commands

```bash
# Run tests
npx tsx tests/test-targeted-enhancement.ts

# Check implementation
grep -n "buildTargetedEnhancement" src/services/commonAppWorkshop/services/collegeOverlayEnhancer.ts

# View current enhancement logic
cat src/services/commonAppWorkshop/services/collegeOverlayEnhancer.ts | head -300
```

---

## Files to Reference

**Design Doc** (comprehensive):
- `docs/COLLEGE_OVERLAY_TARGETED_ENHANCEMENT_DESIGN.md`

**Current Implementation**:
- `src/services/commonAppWorkshop/services/collegeOverlayEnhancer.ts`
- `src/services/commonAppWorkshop/services/typeSpecificSuggestionService.ts`

**College Data**:
- `src/services/commonAppWorkshop/data/stanford.ts` (example)

**Tests**:
- `tests/test-preservation-validation.ts` (Phase 1 test)
- `tests/test-targeted-enhancement.ts` (Phase 2 - to create)

---

## Key Code Locations

```typescript
// Enhancement happens here:
collegeOverlayEnhancer.ts:117-187 (enhance method)
collegeOverlayEnhancer.ts:189-250 (buildEnhancedRationale - needs update)

// Orchestration happens here:
typeSpecificSuggestionService.ts:1212-1375 (two-stage generation)

// College data:
data/stanford.ts (add specific_resources field)
```

---

## Priority

**High** - This completes the college overlay system and enables truly tailored suggestions

**Estimated Effort**: 10-15 hours

**Next Step**: Implement Task 1 (update enhancement prompt)
