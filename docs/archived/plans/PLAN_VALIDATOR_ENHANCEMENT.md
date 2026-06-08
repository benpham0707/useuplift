# PLAN: Add Validator Negative for Meta-Setup/Framing Language

## Problem Analysis

### What We're Seeing (Undesirable Outputs)
The PIQ workshop suggestions are generating openings that use **meta-setup language** - sentences that frame or announce what's coming rather than delivering emotional experience directly:

1. "I wondered: which type was I? Founding Polytechnic's Young Entrepreneur Society would answer that question in ways I never expected."
2. "I had no idea I'd become a living case study of all three theories."
3. "I finally understood which definition fit me. (Spoiler: none of them, exactly.)"

### Why This Is Problematic
- **TELL, not SHOW**: These are telling the reader "something interesting is coming" instead of showing the emotional experience
- **Wasted Space**: Setup is supposed to be concrete details and sensory experience, not meta-commentary about suspense
- **Artificial Suspense**: Phrases like "I had no idea...", "I wondered...", "in ways I never expected" are trying to create suspense through words rather than through emotional engagement
- **Spoiler alerts and asides**: Breaking the fourth wall with "(Spoiler: ...)" pulls reader out of experience

### Root Cause
These patterns are a form of **meta-framing** where the narrator steps outside the story to comment on or preview what's about to happen. It's theatrical setup language rather than experiential storytelling.

## Current System Review

### Step 1: Locate the Validator
First, I need to find where the PIQ workshop suggestion validator lives:
- Check [src/services/narrativeWorkshop/](src/services/narrativeWorkshop/) for validator files
- Look for existing negative guidelines/constraints
- Identify the specific validator that checks PIQ suggestions

### Step 2: Understand Existing Negatives
Review what negative constraints already exist:
- What patterns are already being caught?
- What's the structure/format of negative guidelines?
- Where in the validation flow should this new negative be added?

### Step 3: Analyze Related Systems
Quick check to ensure we understand dependencies:
- What generates the PIQ suggestions?
- What validates them?
- What's the flow from generation → validation → output?

## Proposed Solution

### New Negative Guideline to Add

**Category**: Meta-Setup/Framing Language

**Description**: Avoid sentences that frame or announce what's coming instead of delivering direct emotional experience. The setup should BE the details, not commentary about the details.

**Patterns to Catch**:
- "I wondered..." / "I had no idea..." (retrospective framing)
- "...would answer that question in ways I never expected" (preview of impact)
- "I had no idea I'd become..." (future-looking setup)
- "I finally understood..." (resolution preview)
- "(Spoiler: ...)" (meta-commentary/fourth wall breaks)
- "Little did I know..." (foreshadowing tell)
- "This would change everything" (impact announcement)
- "What happened next..." (suspense setup)

**Why It Fails**: These sentences are words thrown in purely for extra suspense rather than concrete emotional details. They're telling about the emotional journey rather than showing it.

**Better Alternative Example**:
- ❌ "I wondered: which type was I? Founding Polytechnic's Young Entrepreneur Society would answer that question in ways I never expected."
- ✅ "Three competing theories sat in front of me on the syllabus. Founding Polytechnic's Young Entrepreneur Society—I typed my name on the signup sheet before reading past the first line."

## Implementation Plan

### Phase 1: Research (Read-Only)
1. Find the PIQ validator file(s)
2. Read existing negative guidelines structure
3. Understand the validation flow
4. Document current format and patterns

### Phase 2: Design the Addition
1. Draft the exact negative guideline text
2. Determine placement within existing negatives
3. Identify any regex patterns or keywords needed
4. Ensure it aligns with existing guideline format

### Phase 3: Minimal Surgical Addition
1. Add ONLY the new negative guideline
2. Do NOT modify any existing guidelines
3. Do NOT change any validation logic
4. Do NOT alter any other system components

### Phase 4: Verification
1. Review the change is minimal and surgical
2. Verify no other code was modified
3. Test that validation still works
4. Confirm the new negative is properly integrated

## Safety Constraints

### What We WILL Do
✅ Add one new negative guideline to catch meta-setup/framing language
✅ Use existing format and structure
✅ Preserve all existing functionality

### What We Will NOT Do
❌ Modify any existing negatives or guidelines
❌ Change validation logic or flow
❌ Alter suggestion generation system
❌ Touch any other components
❌ Refactor or "improve" existing code
❌ Add any features beyond this single negative

## Success Criteria

1. **Minimal Change**: Only one new negative guideline added
2. **Preserved System**: All existing negatives and validation logic unchanged
3. **Proper Integration**: New negative follows existing format exactly
4. **Testable**: Can verify the negative catches the problematic patterns
5. **No Side Effects**: System behavior unchanged except for catching this specific pattern

## Questions for Approval

Before implementation, please confirm:
1. Does this approach align with your requirement for a "small detail/negative guideline"?
2. Should I proceed with finding the validator file(s)?
3. Any specific patterns beyond the ones I listed that should be caught?

## Next Steps (After Approval)

1. Locate validator file(s) - likely in [src/services/narrativeWorkshop/](src/services/narrativeWorkshop/)
2. Read and understand existing structure
3. Draft exact negative guideline text
4. Make surgical addition
5. Verify no degradation to system
