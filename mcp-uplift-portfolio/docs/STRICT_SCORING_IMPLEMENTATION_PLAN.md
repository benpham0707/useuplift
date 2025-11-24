# Strict Scoring Implementation Plan

## Core Principles

1. **Lower base scores** (20-50 range instead of 70-75)
2. **Cap context bonuses** at +30 total (not +98)
3. **Achievement bonuses unlimited** but harder to earn
4. **90+ means HYPSM competitive** (top 3-5% nationally)
5. **Transparent but strict** scoring

---

## Quick Reference: Score Meanings

| Score | Meaning |
|-------|---------|
| 90-100 | HYPSM competitive (top 3-5%) |
| 80-89 | Strong for top UCs, reach for HYPSM (top 10-15%) |
| 70-79 | Solid UC profile (top 25-30%) |
| 60-69 | Competitive mid-tier UCs (top 50%) |
| <60 | Needs development |

---

## Implementation Changes

### **PIQ 1: Leadership**

**OLD:**
- Base: 75
- Bonuses: +10 for 3+ roles, +10 for 100+ char impact, +5 for 10+ hrs
- Easy to hit 90+

**NEW:**
- **Base:** 20-50 based on leadership **level**
  - 50: Founded org serving 500+ OR state/national position with systemic impact
  - 40: Regional leadership OR captain of top-25 nationally ranked team
  - 30: School-wide leadership with documented measurable impact
  - 20: Leadership role with some impact documentation

- **Achievement Bonuses (unlimited):**
  - National/international recognition: +25-35
  - State/regional impact (1000+ affected): +18-22
  - Founded sustainable organization (100+ served): +15-20
  - Documented transformation with metrics: +12-18
  - 3+ substantive roles: +8-10
  - 15+ hrs/week for 2+ years: +5-8

- **Context Bonuses (MAX +20 for leadership specifically):**
  - Led despite major barriers (first-gen in under-resourced school): +12
  - Self-initiated (created from scratch): +8
  - Overcame documented opposition: +5

**Examples:**
- **Score 92:** Founded nonprofit, 1000+ served, sustainable, $75K raised, Congressional recognition (Base: 50 + Founded: +20 + Impact: +22 = 92)
- **Score 74:** Student Council President, 5 events, 1200 students, 40% satisfaction improvement, 25-person team (Base: 30 + Transformation: +15 + Multi-role: +9 + Time: +6 + Self-initiated: +8 = 68... needs recalibration)

Wait, let me recalibrate again. The issue is:
- Student Council President at a 1200-student school with measurable impact **should** be around 72-76 (solid UC, not quite HYPSM)
- So: Base 30 + Transformation +18 + Leadership breadth +8 + Time +7 + Organization scale +5 = 68

I need to add a "scale bonus":
- **Scale bonus:** +5-10 for leading organization with 500+ members or serving 1000+ people

**Recalculated:** Base 30 + Transform +18 + Scale +8 + Breadth +8 + Time +7 = **71** ✓

- **Score 84:** State debate champion, led team to nationals top 10, mentored 20+, curriculum adopted by 3 schools (Base: 40 + State: +20 + Transformation: +15 + Breadth: +9 = 84) ✓

- **Score 58:** Debate Captain, regional competition, improved team ranking (Base: 30 + Regional: +12 + Transform: +10 + Time: +6 = 58) ✓

---

### **PIQ 4: Educational Barrier**

**OLD:**
- Base: 40
- Context bonuses stack to +98 (first-gen +25, family +20, challenges +20, financial +15, APs +18)
- First-gen + family + 9 APs → 98 score

**NEW Formula:**
```
Score = (Barrier Severity Base) + (Achievement Multiplier) + (Opportunity Creation Bonus)
```

**Barrier Severity Base:**
- **Severe** (homeless, refugee, extreme poverty + working 20+ hrs): **60**
- **Major** (first-gen + family caregiver 15+ hrs, OR undocumented + working): **48**
- **Moderate** (first-gen alone, OR family 10+ hrs, OR working 10+ hrs): **38**
- **Minor** (single small barrier): **28**

**Achievement Multiplier (based on academics achieved DESPITE barriers):**
- Transcendent (12+ APs all 5s + 4.0 + research/publication): **+32**
- Exceptional (10+ APs mostly 5s + 3.9+): **+22**
- Strong (8+ APs + 3.7+): **+16**
- Good (6+ APs/Honors + 3.5+): **+10**
- Adequate (some rigor + 3.0+): **+5**

**Opportunity Creation Bonus (MAX +15):**
- Published research on barriers/equity: +12
- Founded org to help others facing similar barriers (100+ served): +10
- Created program at school (50+ beneficiaries): +7
- Advocacy/policy change: +5

**Examples:**
- **Score 97:** Homeless 2 years + working 25 hrs + 13 APs (all 5s) + 4.0 + research + founded nonprofit helping homeless students (200+ served)
  - Severe: 60 + Transcendent: +32 + Founded org: +10 = **102 → capped at 97**

- **Score 72:** First-gen + family 15 hrs + 9 APs + 3.85 GPA
  - Major: 48 + Strong: +16 + (no org) = **64**... wait this seems low

Let me recalibrate. The issue is first-gen + family 15 hrs is NOT the same severity as undocumented + working. Let me create more granular tiers:

**Barrier Severity (Revised):**
- **Tier 1** (70): Homeless OR refugee with trauma OR extreme poverty (free lunch + working 20+ hrs + family caregiver)
- **Tier 2** (58): Major compound barriers (first-gen + family 15+ hrs + working 10+ hrs) OR (undocumented + working)
- **Tier 3** (48): Moderate compound (first-gen + family 15+ hrs) OR (first-gen + working 15+ hrs)
- **Tier 4** (38): Single major barrier (first-gen alone) OR (family caregiver 15+ hrs alone) OR (working 15+ hrs alone)
- **Tier 5** (28): Minor barrier (family 8 hrs OR working 8 hrs)

**Examples Recalculated:**
- **Homeless**: Tier 1 (70) + Transcendent (+32) + Org (+10) = **112 → capped at 97** ✓

- **First-gen + family 15 hrs + 9 APs + 3.85**: Tier 3 (48) + Strong (+16) = **64**
  - Hmm, still feels low for a student who is genuinely facing barriers and performing well

The issue is: 9 APs + 3.85 GPA for first-gen + family duties IS impressive, but not "HYPSM impressive." For HYPSM, they'd need 11+ APs + 3.95+ OR research/leadership on top.

So score of 64 means: "Strong UC profile, shows resilience, but needs more achievement for HYPSM."

If same student had 11 APs + 3.95: Tier 3 (48) + Exceptional (+22) = **70** (solid UC, reach for HYPSM)

If same student had 12 APs all 5s + 4.0 + research: Tier 3 (48) + Transcendent (+32) + Research (+8) = **88** (competitive for HYPSM)

This feels right! The scoring says:
- **64:** "Your barriers are real and your achievement is good. For HYPSM, push for more rigor/achievement."
- **70:** "Strong profile. HYPSM is within reach if rest of app is exceptional."
- **88:** "This is HYPSM-competitive. Your achievement despite barriers is exceptional."

---

### **PIQ 6: Academic Passion**

**OLD:**
- Base: 70
- +15 for major + rigor, +8 for AP scores 4+
- Easy to hit 90+

**NEW:**

**Base Score (rigor + alignment):**
- **50:** 12+ APs in subject + college coursework + research involvement
- **40:** 10+ APs including subject-related + significant EC
- **30:** 8+ APs + intended major + some subject EC
- **20:** 6+ APs + major declared
- **10:** Some rigor + interest

**Achievement Bonuses (unlimited):**
- Published research (peer-reviewed): +28-35
- Significant research (multi-year, conference): +18-24
- National competition top 10 (USAMO/USACO/USAPhO): +18-22
- Competition qualification/participation: +10-14
- Founded teaching org (100+ students): +10-15
- Independent study (college courses, self-study with proof): +7-10
- Deep EC in subject (15+ hrs/week, 2+ years): +5-8

**Context Bonuses (MAX +15):**
- Self-taught due to school limitations (<5 APs offered): +10
- Created opportunity at under-resourced school: +8
- Overcame language/resource barriers: +5

**Examples:**
- **Score 93:** Published research + USAMO qualifier + 12 APs in math/sci (all 5s) + founded tutoring org (200 students)
  - Base: 50 + Research: +30 + USAMO: +12 + Teaching: +12 = **104 → capped at 93**

- **Score 78:** Significant research + 10 APs + presented at conference + deep lab work (15 hrs/week, 2 years)
  - Base: 40 + Research: +20 + Independent/conference: +9 + EC depth: +7 = **76**... need +2

  Let me bump research bonus: Base: 40 + Research: +22 + Conference: +9 + EC: +7 = **78** ✓

- **Score 65:** 8 APs + intended major (CompSci) + coding club 10 hrs/week + some personal projects
  - Base: 30 + EC depth: +6 + Projects: +5 = **41**... too low

  Issue: a student with 8 APs + major + decent EC should be around 60-65 (competitive for mid-UCs)

  Recalibrate base: Base should be 35 for "8 APs + major + decent EC", then bonuses add from there

  **Adjusted:** Base 35 + Depth EC (club leader): +8 + Projects (substantial): +8 + (could add competition participation +6) = **57**

  Still feels low. Let me reconsider base scores:

**Base Score (Revised):**
- **50:** Research + 12+ APs + college courses (already exceptional before bonuses)
- **42:** 10+ APs + significant subject achievement (strong foundation)
- **35:** 8+ APs + subject ECs with depth
- **27:** 6+ APs + major + some involvement
- **18:** Some rigor + interest

**Re-calculated:**
- **Score 65:** 8 APs + CompSci major + coding club president (12 hrs/week, 2 years) + built 3 substantial apps + hackathon participant
  - Base: 35 + Leadership: +10 + Projects: +10 + Competition: +6 + Depth: +6 = **67** ✓

---

### **PIQ 2 & 3: Creative/Talent**

**NEW Base:**
- **45:** National/international recognition + mastery-level (1000+ hours)
- **38:** State/regional recognition + deep commitment (500+ hrs)
- **30:** Significant achievement (awards, performances) + consistent practice (200+ hrs)
- **22:** Demonstrated skill + regular involvement
- **15:** Participation + interest

**Achievement Bonuses:**
- National/international award: +25-30
- State/regional recognition: +15-20
- Performance/exhibition/publication: +10-15
- Teaching others (founded program): +8-12
- Competition participation: +5-8

**Context (MAX +12):**
- Self-taught without resources: +8
- Created opportunity in under-resourced area: +7
- Overcame barriers to pursue: +5

---

### **Summary of Changes**

| PIQ | OLD Base | NEW Base | OLD Max Context | NEW Max Context | Philosophy |
|-----|----------|----------|-----------------|-----------------|------------|
| 1 (Leadership) | 75 | 20-50 | Unlimited stacking | +20 | Base reflects leadership LEVEL, not just existence |
| 4 (Barrier) | 40 | 28-70 (severity) | +98 | Achievement multiplier only | Barrier severity sets base, achievement multiplies |
| 6 (Academic) | 70 | 18-50 | +23 | +15 | Base reflects rigor + achievement, not just interest |
| 2/3 (Creative/Talent) | 70 | 15-45 | +15 | +12 | Base reflects recognition level |

**Result:** 90+ scores now require **exceptional achievement**, not just good profile + context stacking.

---

## Next Steps

1. Implement new scoring in `src/tools/index.ts`
2. Update all 8 PIQ algorithms
3. Test with profiles:
   - First-gen + family + 9 APs (should score 64-68, not 98)
   - Homeless + 13 APs + research + nonprofit (should score 95-97, was 98)
   - Student Council + measurable impact (should score 71-75, not 90)
4. Verify score distribution matches HYPSM reality
