# Quick Start: Running Research Through Perplexity/Comet

**For**: User delegating research tasks to AI tools
**Time**: 5-10 minutes per research request
**Goal**: Get precise, verifiable sources for college essay evaluation weights

---

## 🚀 Quick Instructions

### Step 1: Open Research Requests File

Open [RESEARCH_REQUESTS_FOR_AI.md](RESEARCH_REQUESTS_FOR_AI.md) and choose a request to run.

**Recommended Order** (highest impact first):
1. Request 1: Stanford University ← Start here
2. Request 2: Yale University
3. Request 4: Common Data Set meta-analysis
4. Request 3: UChicago

### Step 2: Copy Request into Perplexity/Comet

Copy the ENTIRE request section including:
- All sub-sections (A, B, C, D, etc.)
- Required output structure
- Specific search instructions
- Quality requirements

**Example**: For "Request 1: Stanford University", copy from:
```
### Request 1: Stanford University - Complete 5-Source Verification
```
All the way through to the end of that request section.

### Step 3: Run Search

Paste into Perplexity or Comet and let it search.

**Important**: Tell the AI tool:
- "Use EXACT QUOTES only - no paraphrasing"
- "Provide working URLs for all sources"
- "Follow the required output structure precisely"

### Step 4: Validate Results

Before pasting back, quickly check:
- ✅ All 5 source types provided?
- ✅ Quotes are in quotation marks (exact)?
- ✅ URLs are included?
- ✅ Dates are provided?

**If incomplete**: Re-run with specific instruction like "Please provide the missing CDS Section C7 data" or "Need exact quotes, not paraphrases"

### Step 5: Paste Results Back Here

Copy the complete research results and paste them in our conversation.

Say something simple like:
> "Here are the results for Request 1 (Stanford)"
> [paste results]

I'll then:
1. Validate using quality checklist
2. Calculate verification scores
3. Integrate into COLLEGE_OVERLAY_DATABASE.md
4. Update completion tracking

---

## 📋 What Each Request Needs (5 Sources)

Every college research request needs these 5 sources:

### Source 1: Institutional (Mission/CDS/Strategic Plan)
**What to find**: Official mission statement or strategic plan
**Where**: College's official website (.edu domain)
**Format needed**: Title, URL, date, EXACT QUOTE

### Source 2: Common Data Set Section C7
**What to find**: Official CDS with Section C7 admission factors
**Where**: Search "[College] Common Data Set 2023-2024"
**Format needed**: Table with ratings (Very Important/Important/Considered/Not Considered)

### Source 3: Admissions Officer Quote
**What to find**: Dean or Director of Admissions statement about priorities
**Where**: Interviews, blogs, official college admissions website, books
**Format needed**: Name, title, source, date, EXACT QUOTE

### Source 4: Expert/Research Source
**What to find**: Book or study by expert (former AO, journalist, researcher)
**Where**: "Who Gets In and Why" (Selingo), "Admission Matters", NACAC research
**Format needed**: Author, title, publisher, year, ISBN, EXACT EXCERPT

### Source 5: Comparative Analysis
**What to find**: How this college differs from peer institutions
**Where**: Compare CDS data, mission statements, or expert analysis
**Format needed**: Clear comparison with 2-3 peer schools

---

## ⚡ Speed Tips

**For Fastest Results**:

1. **Run multiple requests in parallel** in different Perplexity/Comet sessions
2. **Start with high-priority** colleges (Stanford, Yale, UChicago)
3. **Batch similar requests** (e.g., all CDS requests at once)
4. **Check output format early** - if first request format is wrong, fix before continuing

**Avoid These Mistakes**:
- ❌ Accepting paraphrased quotes instead of exact
- ❌ Skipping CDS Section C7 (crucial for verification)
- ❌ Missing URLs (we need verifiable sources)
- ❌ Using outdated sources (pre-2020)

---

## 📊 Priority Research Requests (Impact-Ranked)

### Tier 1: Immediate High Impact (Do First)

**Request 1: Stanford University**
- Why: Partially verified, needs completion
- Impact: Major school with unique "intellectual vitality" emphasis
- Time: 8-10 minutes

**Request 2: Yale University - CDS**
- Why: Missing CDS validation
- Impact: Complete verification for Ivy League school
- Time: 5-7 minutes

**Request 4: Common Data Set Meta-Analysis**
- Why: Validates ALL 30 schools at once
- Impact: Foundation for all college verification
- Time: 15-20 minutes (comprehensive)

### Tier 2: High Impact (Do Second)

**Request 3: UChicago**
- Why: Unique quirky essay approach
- Impact: Different evaluation framework than peers
- Time: 8-10 minutes

**Request 5: Columbia, Request 6: Duke, Request 7: Brown**
- Why: Complete top 10 coverage
- Impact: Major schools, distinct institutional values
- Time: 8-10 minutes each

### Tier 3: Pattern Validation (Do Third)

**Requests 10-14: Universal Pattern Expert Sources**
- Why: Validates base frameworks for all schools
- Impact: Foundation that applies to 100+ colleges beyond top 30
- Time: 5-8 minutes each

### Tier 4: Comprehensive Extraction (Do Last)

**Request 16: Admissions Officer Quote Database**
- Why: Comprehensive across multiple schools
- Impact: 50+ quotes, high-credibility sources
- Time: 20-30 minutes (extensive)

**Request 17: Expert Book Comprehensive Extraction**
- Why: Deep insights from 5 major books
- Impact: Expert validation for multiple dimensions
- Time: 30-40 minutes (extensive)

---

## 🎯 Sample Prompt for Perplexity/Comet

When pasting a request, you can add this header:

```
I need comprehensive research for college essay evaluation weights.
Please provide EXACT QUOTES (not paraphrased) from verifiable sources.

[paste request from RESEARCH_REQUESTS_FOR_AI.md]

CRITICAL REQUIREMENTS:
1. All quotes must be EXACT - use quotation marks
2. Provide working URLs for every source
3. Include dates (publication or access)
4. Follow the required output structure precisely
5. For CDS: Extract Section C7 admission factors table completely
6. For admissions officers: Include full name and title
```

---

## 📥 What Happens After You Paste Results

I will:

1. **Validate** (2-3 minutes):
   - Check all 5 sources present
   - Verify quotes are exact (spot check)
   - Test URLs accessible
   - Confirm format matches requirements

2. **Calculate Verification Scores** (1-2 minutes):
   - Score each source 0-100
   - Apply weighted formula
   - Determine final verification score
   - Map to weight range

3. **Integrate into Database** (5-10 minutes):
   - Add complete college section
   - Create source chain tables
   - Write student-facing citations
   - Update all cross-references

4. **Update Tracking** (1 minute):
   - Mark college as "Fully Verified"
   - Update completion percentage
   - Note in system summary

5. **Confirm Completion** (instant):
   - Report verification score achieved
   - Show updated completion stats
   - Note any adjustments made

**Total Processing Time per Request**: 10-15 minutes after you provide research

---

## 🔢 Progress Tracking

As you complete research requests, track here:

**Week 1 Priority** (4 requests):
- [ ] Request 1: Stanford
- [ ] Request 2: Yale CDS
- [ ] Request 3: UChicago
- [ ] Request 4: CDS Meta-Analysis

**Week 2 Priority** (7 requests):
- [ ] Request 5: Columbia
- [ ] Request 6: Duke
- [ ] Request 7: Brown
- [ ] Request 10: Pattern 3 (Disagreement)
- [ ] Request 11: Pattern 5 (Challenge)
- [ ] Request 12: Pattern 6 (Activity)
- [ ] Request 13: Pattern 7 (Joy)

**Week 3 Priority** (6 requests):
- [ ] Request 8: Northwestern
- [ ] Request 9: Dartmouth
- [ ] Request 14: Johns Hopkins
- [ ] Request 15: Pattern 8 (Goals)
- [ ] Request 16: AO Quote Database
- [ ] Request 17: Expert Books

**Completion Status**:
- Completed: 0/17 (0%)
- Target: 17/17 (100%)

---

## 💡 Pro Tips

### Getting Better Results from AI Research Tools:

1. **Be explicit about EXACT QUOTES**:
   - Say "copy exact text in quotation marks"
   - NOT "summarize" or "paraphrase"

2. **Request verification**:
   - "Please verify all URLs are accessible"
   - "Confirm these are direct quotes from original sources"

3. **Specify date range**:
   - "Use sources from 2020-2025 only"
   - "Prioritize most recent CDS available"

4. **Ask for credentials**:
   - "Include author credentials (former AO, dean, etc.)"
   - "Specify person's role and title"

5. **Request comparison explicitly**:
   - "Compare [College] to [Peer 1] and [Peer 2]"
   - "Show specific differences in CDS Section C7 ratings"

### If Search Tool Can't Find Something:

**CDS not found?**
- Try: "[College] Institutional Research Common Data Set"
- Try: "[College] IR Office CDS"
- Try: Search college website → About → Institutional Research

**Admissions officer quote not found?**
- Try: "[Dean name] [College] admissions interview"
- Try: "[College] admissions blog dean interview"
- Try: "What [College] looks for in students" + dean name

**Expert book not accessible?**
- Try: Google Books preview (often has excerpts)
- Try: Amazon "Look Inside" feature
- Try: Internet Archive (archive.org) for older books
- Alternative: Find different expert source (NACAC, other books)

---

## 🎁 Bonus: What You Get When Complete

After all 17 requests completed and integrated:

**For Students**:
- ✅ Transparent weight justification with exact sources
- ✅ "Why does Cornell value X?" → Answered with dean quote + CDS data
- ✅ Confidence that evaluation reflects actual college priorities

**For System**:
- ✅ 90%+ weights validated with 5+ independent sources each
- ✅ Verification scores (0-100) for every dimensional weight
- ✅ Complete institutional differentiation (Harvard ≠ MIT ≠ Stanford)
- ✅ Credible citations for all evaluation decisions

**For Database**:
- ✅ COLLEGE_OVERLAY_DATABASE.md: 2,238 → 6,000+ lines
- ✅ 30+ colleges fully verified with source chains
- ✅ 50+ admissions officer quotes with attribution
- ✅ All 14 patterns expert-validated

---

## ❓ Common Questions

**Q: How long will all 17 requests take?**
A: ~3-5 hours total if done efficiently (batch processing, parallel searches)

**Q: Can I do them in any order?**
A: Yes, but prioritized order (Tier 1 → Tier 2 → Tier 3 → Tier 4) has highest impact first

**Q: What if Perplexity/Comet can't find some sources?**
A: That's fine - paste what they found, note what's missing, we'll work with partial verification and document gaps

**Q: Do all 5 sources need to be perfect?**
A: No - even 3-4 solid sources gets "Partially Verified" status, which is useful. We'll note what's missing and can search more later.

**Q: How do I know if the output format is correct?**
A: Check that it matches the "Required Output Structure" shown in each request. Should have clear sections: Source 1, Source 2, etc. with all required fields (Title, URL, Date, Quote).

**Q: Can I modify the requests?**
A: Yes! If you know better search terms or sources, adjust. The key requirements are: (1) 5 source types, (2) exact quotes, (3) working URLs, (4) dates.

---

## 🚀 Ready to Start?

1. Open [RESEARCH_REQUESTS_FOR_AI.md](RESEARCH_REQUESTS_FOR_AI.md)
2. Start with **Request 1: Stanford University**
3. Copy entire request into Perplexity/Comet
4. Add instruction: "Use EXACT QUOTES only, provide all URLs"
5. Run search
6. Validate results have all 5 sources
7. Paste results back here

**I'll handle the rest**: validation, scoring, integration, tracking!

---

**Current Status**: ⏸️ Ready for you to start research
**Next Step**: Choose first request, copy into AI tool, run search
**Expected Result**: High-quality, verifiable sources that make our system transparent and credible

Let's transform from 8% → 90% verified! 🎯
