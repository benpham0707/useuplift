# Research Integration Template
## How to Process AI Research Results into College Overlay Database

**Purpose**: This template provides step-by-step instructions for integrating research results from Perplexity/Comet into COLLEGE_OVERLAY_DATABASE.md with proper verification scoring.

---

## Step 1: Validate Research Format

When research results arrive, verify they include:

✅ **All 5 Required Sources**:
1. Institutional (Mission/CDS) - Must have exact quote + URL
2. Common Data Set Section C7 - Must have ratings table
3. Admissions Officer Quote - Must have name, title, exact quote
4. Expert/Research Source - Must have author, book/article, excerpt
5. Comparative Data - Must have peer institution comparison

✅ **Required Fields for Each Source**:
- Title/Name
- URL (if available)
- Date published/accessed
- Exact quote or data (no paraphrasing)
- Reliability rating (✅✅✅ / ✅✅ / ✅)

❌ **Reject Research If**:
- Fewer than 5 sources provided
- Quotes are paraphrased instead of exact
- URLs are broken or inaccessible
- CDS Section C7 data is missing
- Admissions officer quotes lack attribution

---

## Step 2: Calculate Weighted Verification Score

Use this formula to convert research into a 0-100 verification score:

```
Verification Score =
  (Institutional Score × 30%) +
  (Prompt Analysis Score × 25%) +
  (Admissions Officer Score × 25%) +
  (Expert/Research Score × 15%) +
  (Comparative Analysis Score × 5%)
```

### Scoring Each Source (0-100 scale):

**Institutional Sources (30% weight)**:
- 100 points: Official mission statement + CDS showing "Very Important"
- 85 points: Mission statement OR CDS showing "Very Important"
- 70 points: Strategic plan or president's letter mentioning priority
- 50 points: Indirect institutional evidence (website language, etc.)
- 25 points: Weak institutional connection

**Prompt Analysis (25% weight)**:
- 100 points: Dimension EXPLICITLY stated in prompt (e.g., "meaningful to you")
- 85 points: Dimension strongly implied by prompt language
- 70 points: Dimension required to answer prompt well
- 50 points: Dimension helpful but not essential
- 25 points: Dimension tangentially related

**Admissions Officer Statements (25% weight)**:
- 100 points: Direct quote from Dean of Admissions about specific dimension
- 85 points: Quote from admissions officer specifically about this essay type
- 70 points: General statement about priorities that includes this dimension
- 50 points: Indirect statement that implies dimension importance
- 25 points: Generic statement about "holistic review"

**Expert/Research Sources (15% weight)**:
- 100 points: Former admissions officer from THIS SCHOOL analyzing THIS dimension
- 85 points: Expert analysis specifically about this school + essay type
- 70 points: NACAC research or multi-school study validating dimension
- 50 points: General admissions book mentioning dimension importance
- 25 points: Weak expert connection or outdated research

**Comparative Analysis (5% weight)**:
- 100 points: Clear differentiation from 3+ peer schools with data
- 85 points: Comparison to 2 peer schools showing unique emphasis
- 70 points: Comparison to 1 peer school
- 50 points: General statement about how school differs
- 25 points: Weak or no comparative data

### Example Calculation:

**MIT technical_depth Dimension (35% weight)**:

```
Source 1 (Institutional): 100 points
- Mission: "advancing knowledge in science, technology, and engineering"
- CDS C7: Talent/ability = "Very Important"
Score: 100 × 0.30 = 30.0

Source 2 (Prompt): 100 points
- "Your favorite STEM-related topic or experience and how it relates to your field of interest"
- EXPLICITLY asks about STEM depth
Score: 100 × 0.25 = 25.0

Source 3 (Admissions Officer): 85 points
- Dean of Admissions Stuart Schmill: "We look for students who demonstrate mastery..."
- Specific to STEM evaluation
Score: 85 × 0.25 = 21.25

Source 4 (Expert): 85 points
- "Who Gets In and Why" (Selingo): "MIT evaluates technical sophistication..."
- Former MIT AO insights
Score: 85 × 0.15 = 12.75

Source 5 (Comparative): 100 points
- MIT = theory focus vs. Stanford = application focus vs. Caltech = research focus
- Clear 3-way differentiation
Score: 100 × 0.05 = 5.0

TOTAL VERIFICATION SCORE: 30.0 + 25.0 + 21.25 + 12.75 + 5.0 = 94.0/100
```

---

## Step 3: Map Score to Weight Range

Use verification score to determine appropriate dimensional weight:

| Verification Score | Weight Range | Confidence Level |
|-------------------|--------------|------------------|
| 90-100 | 30-35% | ✅✅✅ Highest - Primary dimension |
| 80-89 | 25-29% | ✅✅ High - Major dimension |
| 70-79 | 20-24% | ✅✅ High - Important dimension |
| 60-69 | 15-19% | ✅ Moderate - Secondary dimension |
| 50-59 | 10-14% | ✅ Moderate - Minor dimension |
| 40-49 | 5-9% | ⚠️ Low - Minimal dimension |
| 0-39 | 0-4% | ❌ Insufficient evidence |

**MIT technical_depth (94.0 score) → 30-35% range → Assign 35%**

---

## Step 4: Create Source Chain Table

For each fully verified dimension, create this table in COLLEGE_OVERLAY_DATABASE.md:

```markdown
### [College Name] - [Essay Pattern] - SOURCE CHAIN

#### Dimension: [dimension_name] (Weight: X%)

**Verification Score**: X.X/100 ✅✅✅ (Highest confidence)

| Source Type | Evidence | Score | Weighted |
|-------------|----------|-------|----------|
| **Institutional (30%)** | [Brief description] | XX/100 | X.X |
| **Prompt Analysis (25%)** | [Brief description] | XX/100 | X.X |
| **Admissions Officer (25%)** | [Brief description] | XX/100 | X.X |
| **Expert/Research (15%)** | [Brief description] | XX/100 | X.X |
| **Comparative (5%)** | [Brief description] | XX/100 | X.X |
| **TOTAL** | | | **XX.X/100** |

**Weight Determination**: Score XX.X falls in X-X range → [Weight]% assigned

**Student-Facing Citation**:
> "[College] emphasizes [dimension] in their [essay type] evaluation based on: (1) institutional mission stating '[quote]', (2) explicit prompt language asking for '[quote]', (3) Dean [Name] stating '[quote]', (4) admissions research showing [finding], and (5) comparison to peer schools showing [distinction]."
```

---

## Step 5: Add Complete College Section

Add to COLLEGE_OVERLAY_DATABASE.md following this structure:

```markdown
## [COLLEGE NAME] - Complete Verification

**Verification Status**: ✅ FULLY VERIFIED (X+ sources)
**Last Updated**: [Date]
**Overall Confidence**: ✅✅✅ Highest

---

### [Pattern X]: [Pattern Name]

**Universal Base Framework**: [Link to universal pattern]
**[College] Overlay Adjustment**: [Describe how differs from universal]

#### Dimensional Weights:

```typescript
[college_name]_[pattern]_overlay = {
  dimension_1: {
    weight: XX,
    verification_score: XX.X,
    confidence: "✅✅✅"
  },
  dimension_2: {
    weight: XX,
    verification_score: XX.X,
    confidence: "✅✅"
  },
  // ... all dimensions must sum to 100
}
```

**Key Institutional Values Reflected**:
- [Value 1]: [How it affects weights]
- [Value 2]: [How it affects weights]

**Comparison to Universal Framework**:

| Dimension | Universal | [College] | Difference | Reason |
|-----------|-----------|-----------|------------|--------|
| dimension_1 | XX% | XX% | +/- X% | [Institutional reason] |
| dimension_2 | XX% | XX% | +/- X% | [Institutional reason] |

---

### Source 1: Institutional - [Title]

**Document**: [Exact title]
**URL**: [Direct URL]
**Type**: Primary Source
**Reliability**: ✅✅✅ (Highest)
**Date**: [Date published/accessed]

**Key Excerpt**:
> "[EXACT QUOTE - no paraphrasing]"

**Weight Implications**:
- Validates [dimension_1]: [How quote supports this dimension]
- Validates [dimension_2]: [How quote supports this dimension]

---

### Source 2: Common Data Set Section C7

**Document**: [College] Common Data Set [Year]
**URL**: [Direct URL to CDS]
**Type**: Primary Source - Official Institutional Data
**Reliability**: ✅✅✅ (Highest)
**Year**: [Academic year]

**Section C7 - Relative Importance of Admission Factors**:

| Academic Factor | Rating |
|----------------|--------|
| Rigor of secondary school record | [Very Important/Important/Considered/Not Considered] |
| Class rank | [rating] |
| Academic GPA | [rating] |
| Standardized test scores | [rating] |

| Nonacademic Factor | Rating |
|--------------------|--------|
| Character/personal qualities | [rating] |
| Extracurricular activities | [rating] |
| Talent/ability | [rating] |
| Volunteer work | [rating] |
| Work experience | [rating] |
| Interview | [rating] |
| Application essay | [rating] |

**Key Findings**:
- [Finding 1 from CDS data]
- [Finding 2 from CDS data]

**Weight Implications**:
- [How CDS data validates specific dimensions]

**Comparative Insight**:
- [College] marks [factor] as "[rating]" vs. [Peer School] marks it "[rating]"
- This validates [dimension] emphasis

---

### Source 3: Admissions Officer Statement

**Person**: [Full Name], [Title]
**Institution**: [College name]
**Source**: [Interview/Blog/Book/Video]
**URL**: [If available]
**Date**: [Publication date]
**Type**: Secondary Source
**Reliability**: ✅✅ (High)

**Context**: [Where/why this statement was made]

**Exact Quote**:
> "[EXACT QUOTE from admissions officer - no paraphrasing]"

**Weight Implications**:
- Validates [dimension]: [How quote supports dimension]
- Provides insight into [aspect of evaluation]

---

### Source 4: Expert/Research Source

**Author**: [Full name(s)]
**Title**: [Book title or article title]
**Publisher**: [Publisher name]
**Year**: [Publication year]
**ISBN/URL**: [If available]
**Type**: Tertiary Source
**Reliability**: ✅ (Moderate to High depending on author credentials)
**Author Credentials**: [Former AO, journalist, researcher, etc.]

**Relevant Excerpt**:
> "[EXACT QUOTE about this college's priorities]"

**Analysis**:
- [How this expert source validates dimensional weights]
- [Any additional context or findings]

---

### Source 5: Comparative Analysis

**Comparison**: [College] vs. [Peer 1] vs. [Peer 2]
**Data Sources**: [Where comparison data comes from]
**Type**: Analytical synthesis
**Reliability**: ✅ (Moderate)

**Key Differentiators**:

| Aspect | [College] | [Peer 1] | [Peer 2] | Implication |
|--------|-----------|----------|----------|-------------|
| [Factor 1] | [Data] | [Data] | [Data] | [What this means for weights] |
| [Factor 2] | [Data] | [Data] | [Data] | [What this means for weights] |

**Unique Institutional Emphasis**:
- [How this college differs from peers in ways that affect essay evaluation]

---

### SOURCE CHAIN SUMMARY - [Pattern Name]

#### [Dimension 1]: [Name] (XX%)

**Verification Score**: XX.X/100 ✅✅✅

[Full source chain table as shown in Step 4]

#### [Dimension 2]: [Name] (XX%)

**Verification Score**: XX.X/100 ✅✅

[Full source chain table]

[Repeat for all dimensions]

---

### COMPLETE OVERLAY SUMMARY

**Patterns Verified for [College]**: [List all patterns]
**Total Sources Gathered**: [Number]
**Average Verification Score**: [X.X/100]
**Overall Confidence Level**: ✅✅✅ / ✅✅ / ✅

**Next Steps**:
- [ ] Additional patterns to verify: [List]
- [ ] Sources to gather: [List]
- [ ] Last updated: [Date]

```

---

## Step 6: Update System Completion Summary

After adding each fully verified college, update SYSTEM_COMPLETION_SUMMARY.md:

```markdown
**Current Verification Status**:
- ✅ **Fully Verified** (7+ sources):
  - [Previous colleges]
  - [New college] - [dimension_1] (XX%), [dimension_2] (XX%) - NEW
- ⚠️ **Partially Verified** (3-5 sources): [List]
- 📋 **Pending Research**: [List]
```

---

## Step 7: Quality Checks

Before considering a college section complete, verify:

✅ **All weights sum to exactly 100%**
✅ **Every dimension has minimum 5 sources**
✅ **All quotes are EXACT (not paraphrased)**
✅ **All URLs are accessible and verified**
✅ **CDS Section C7 data is complete**
✅ **Source chain tables calculated correctly**
✅ **Student-facing citations written**
✅ **Comparison to universal framework documented**
✅ **Institutional values clearly linked to weight decisions**

---

## Example: Complete Integration Workflow

### When Research Arrives for "Request 2: Yale University - CDS + Enhanced Verification"

**Step 1**: Validate format
- ✅ Check all 5 sources present
- ✅ Check exact quotes provided
- ✅ Check URLs accessible

**Step 2**: Calculate scores
- Institutional: 100 × 0.30 = 30.0
- Prompt: 100 × 0.25 = 25.0
- Admissions Officer: 85 × 0.25 = 21.25
- Expert: 70 × 0.15 = 10.5
- Comparative: 85 × 0.05 = 4.25
- **Total: 91.0/100** ✅✅✅

**Step 3**: Map to weight
- 91.0 score → 90-100 range → 30-35% weight range
- Assign 30% to identity_connection (primary dimension)

**Step 4**: Create source chain table
- Build complete table showing all 5 sources
- Show weighted calculation
- Write student-facing citation

**Step 5**: Add to database
- Find Yale section in COLLEGE_OVERLAY_DATABASE.md (currently line 824)
- Add new sources after existing content
- Update weights if verification changes them
- Add source chain tables for all dimensions

**Step 6**: Update SYSTEM_COMPLETION_SUMMARY.md
- Move Yale from "Partially Verified" to "Fully Verified"
- Update total source count

**Step 7**: Quality check
- Verify all 7 checklist items
- Test that weights sum to 100%

---

## Priority Order for Integration

When research results arrive for multiple colleges, integrate in this priority order:

**Week 1 (Highest Priority)**:
1. Stanford University - Most requested, need full verification
2. Yale University - Complete CDS Section C7 data
3. UChicago - Unique quirky essay analysis needed
4. Common Data Set meta-analysis - Validates all colleges

**Week 2**:
5. Columbia University - Core Curriculum emphasis
6. Duke University - Complete package
7. Brown University - Open Curriculum distinction
8. Universal Pattern validations (3, 5, 6)

**Week 3**:
9. Northwestern, Dartmouth, Johns Hopkins
10. Patterns 7-8 universal validation
11. Admissions officer quote database
12. Expert book comprehensive extraction

---

## Templates for Common Scenarios

### Scenario A: Research Confirms Current Weights
```markdown
**Verification Result**: Current weights CONFIRMED ✅
- [dimension]: XX% (unchanged)
- Verification score: XX.X/100 validates current weight
```

### Scenario B: Research Suggests Weight Adjustment
```markdown
**Verification Result**: Weight adjustment recommended ⚠️

**Current Weight**: XX%
**Verification Score**: XX.X/100
**Recommended Weight Range**: XX-XX%
**Recommended New Weight**: XX%

**Rationale**: [Explain why adjustment needed based on sources]

**Change Summary**:
- [dimension_1]: XX% → XX% (±X%)
- [dimension_2]: XX% → XX% (±X%)
- [Total still sums to 100% ✅]
```

### Scenario C: Insufficient Evidence for Dimension
```markdown
**Verification Result**: Insufficient evidence ❌
- Verification score: XX.X/100 (below 40 threshold)
- Dimension weight: Reduce to 0-4% or remove
- Redistribute weight to better-verified dimensions
```

---

## Troubleshooting

**Issue**: Research provides only 3-4 sources instead of 5
- **Solution**: Mark as "Partially Verified" (⚠️), add to pending research list, integrate what we have, continue searching for missing sources

**Issue**: Quotes are paraphrased instead of exact
- **Solution**: Request re-search with "EXACT QUOTES ONLY" specification, do not integrate paraphrased content

**Issue**: CDS Section C7 not available for college
- **Solution**: Check college's Institutional Research page, email IR office, or mark as "CDS unavailable" and weight Institutional source at 0% (redistribute to other 4 sources)

**Issue**: Verification scores don't match current weights
- **Solution**: Calculate score → map to range → if different from current, document adjustment in WEIGHT_ADJUSTMENTS_SUMMARY.md with full rationale

**Issue**: Sources contradict each other
- **Solution**: Weight by reliability (Primary > Secondary > Tertiary), note contradiction in database, favor more recent/official sources

---

## Success Metrics

After integrating research for all 17 requests, we should achieve:

✅ **30+ colleges** with "Fully Verified" status (7+ sources each)
✅ **90%+ dimensional weights** validated with verification scores
✅ **Complete CDS Section C7 data** for all top 30 schools
✅ **50+ admissions officer quotes** documented with attribution
✅ **Clear institutional differentiation** showing how colleges differ
✅ **Student-facing citations** for every major dimensional weight
✅ **Source chain transparency** allowing weight decisions to be audited

---

## Next Action

**When research results arrive**:
1. Read this template completely
2. Validate research format (Step 1)
3. Calculate verification scores (Step 2)
4. Follow Steps 3-7 sequentially
5. Update COLLEGE_OVERLAY_DATABASE.md
6. Update SYSTEM_COMPLETION_SUMMARY.md
7. Run quality checks

**Current Status**: ⏸️ Waiting for AI research results from Perplexity/Comet

**Once Integrated**: System will have enhanced credibility with transparent, multi-source verification for all dimensional weights, allowing students and counselors to understand exactly WHY each college values specific aspects of essays.
