# Integrity System Quick Reference

## Context Adjustment Values (Harvard Scale)

**Remember: Lower score = better on Harvard scale. Negative adjustments are BENEFICIAL.**

### VERIFIED (High Confidence - From Harvard Lawsuit)

| Factor | Adjustment | Notes |
|--------|------------|-------|
| Recruited Athlete (Tier 1: Football, Basketball) | -2.5 | 86% acceptance rate |
| Recruited Athlete (Tier 2: Soccer, Lacrosse, etc.) | -2.0 | |
| Recruited Athlete (Tier 3: Crew, Fencing, etc.) | -1.5 | |
| Legacy (Primary - Parent) | -1.5 | 34% acceptance rate |
| Legacy (Secondary - Sibling, Grandparent) | -0.5 | Derived |
| Development Case (Major Donor $1M+) | -1.5 | |
| Development Case (Significant $100K+) | -0.8 | Derived |

### ESTIMATED (Medium Confidence - Practitioner Consensus)

| Factor | Adjustment | Notes |
|--------|------------|-------|
| First-Generation Student | -0.3 to -0.5 | Schools value; no hard data |
| Low-Income (Pell Eligible) | -0.3 to -0.5 | Socioeconomic diversity |
| Rural/Underrepresented State | -0.2 to -0.4 | Geographic diversity |
| ED Application | -0.3 to -0.5 | ~1.6x boost = ~0.4 |
| Under-resourced School | -0.2 to -0.4 | Context consideration |
| Recent Immigrant/Refugee | -0.2 to -0.4 | Overcoming adversity |
| Significant Family Challenges | -0.2 to -0.4 | Case-dependent |

### PENALTIES (Higher Expectations)

| Factor | Adjustment | Notes |
|--------|------------|-------|
| Elite Prep School (Exeter, Andover, etc.) | +0.2 to +0.3 | Higher bar |
| Competitive Magnet (TJ, Stuyvesant, etc.) | +0.1 to +0.2 | Higher bar |
| High-Income + Full Resources | +0.1 to +0.2 | Should maximize |

### CAPS

| Cap Type | Value |
|----------|-------|
| Maximum beneficial adjustment (non-hook) | -1.5 |
| Maximum penalty adjustment | +0.5 |
| Score floor | 1.0 |
| Score ceiling | 6.0 |
| **Hooks bypass cap** | Yes |

---

## School CDS Section C7 Summary

### Harvard (2023-24)
**Very Important:** Rigor of curriculum, GPA, Essays, Recommendations, Character/Personal Qualities
**Important:** Extracurriculars, Talent/Ability
**Considered:** Interview, First-gen, Alumni relation, Geography, Volunteer, Work
**Not Considered:** State residency, Religious affiliation

### MIT (2024-25)
**Very Important:** Character/Personal Qualities (ONLY factor)
**Important:** GPA, Rigor, Test scores, Essays, Recommendations, Interview, Extracurriculars, Talent/Ability
**Considered:** Volunteer, Work, First-gen
**Not Considered:** Level of applicant interest

### Stanford (2024-25)
**Very Important:** Rigor, GPA, Essays, Recommendations, Extracurriculars, Talent/Ability, Character
**Important:** Class rank
**Considered:** Standardized tests, Interview, First-gen, Geographic, State residency, Volunteer, Work
**Not Considered:** Alumni relation, Level of applicant interest

---

## School Distinctive Values (Use Categorical, Not Numeric)

### Stanford
- **Distinctive Priority:** Intellectual vitality, Creativity/Innovation, Builders/Creators
- **Valued:** Research, Entrepreneurship
- **Standard:** Leadership, Community service
- **Less Emphasis:** Traditional structured activities

### MIT
- **Distinctive Priority:** Personal character, Hands-on making/building, Collaborative spirit
- **Valued:** Technical projects, Research, "Nerdy" enthusiasm
- **Standard:** Leadership
- **Less Emphasis:** Traditional extracurriculars without technical depth

### Harvard
- **Distinctive Priority:** Leadership with impact, Future change-makers
- **Valued:** Intellectual breadth, Community building
- **Standard:** Research, Arts
- **Less Emphasis:** Pure technical focus without broader engagement

### Yale
- **Distinctive Priority:** Intellectual breadth, Arts/Creative excellence, Residential community fit
- **Valued:** Drama, Music, Writing
- **Standard:** Leadership, Research
- **Less Emphasis:** Pure STEM without humanities interest

### Princeton
- **Distinctive Priority:** Service orientation, Community engagement, Independent scholarship
- **Valued:** Athletics (more than other Ivies), Research
- **Standard:** Leadership, Arts
- **Less Emphasis:** Urban-focused activities

### Brown
- **Distinctive Priority:** Self-directed learning, Authenticity/Voice, Social consciousness
- **Valued:** Arts, Interdisciplinary interests
- **Standard:** Research
- **Less Emphasis:** Traditional competitive activities, Pure business focus

---

## Probability Communication

### Category Definitions

| Category | Probability Range | Message |
|----------|------------------|---------|
| Safety | >60% | Strong likelihood of admission |
| Likely | 40-60% | Probable admission with solid execution |
| Target | 20-40% | Competitive candidate |
| Reach | 8-20% | Possible but not probable |
| High Reach | <8% | Admission would be exceptional outcome |

### Always Use Ranges

**DON'T:** "You have a 15% chance"
**DO:** "In competitive range (10-20%) - admission possible with strong execution"

### Include Uncertainties

Always note what could swing the outcome:
- Essay quality (can move +/- 5-10pp)
- Recommendation strength
- Interview performance
- Demonstrated interest (at schools that track)
- Application timing (ED boost)

---

## Source Citation Format

```typescript
{
  tier: 1,  // 1=Gold, 2=Silver, 3=Bronze, 4=Estimate
  name: 'Harvard University',
  document: 'Common Data Set 2024-25',
  url: 'https://oira.harvard.edu/common-data-set/',
  accessDate: '2026-02-04',
  expirationDate: '2026-09-01',  // When new CDS expected
  notes: 'Section C7 - Basis for Selection'
}
```

---

## Implementation Priorities

### P0 (Critical - Do First)
1. Convert multiplicative adjustments to additive in `contextAdjustmentDatabase.ts`
2. Add adjustment caps
3. Remove/deprecate race-based factors
4. Add source citations to all data points

### P1 (High - Do Soon)
5. Replace numeric school weights with categorical emphasis
6. Add staleness tracking to data
7. Implement probability ranges instead of point estimates
8. Add heuristic validation for LLM outputs

### P2 (Medium - Do Later)
9. Build data freshness alerting
10. Add edge case handling (homeschool, international, gap year)
11. Expand pay-to-play detection list
12. Add outcome tracking framework

---

## Key Numbers to Remember

| Metric | Value | Source |
|--------|-------|--------|
| Harvard legacy admission rate | 33.6% | Harvard lawsuit |
| Harvard recruited athlete rate | 86% | Harvard lawsuit |
| Harvard non-ALDC white rate | 4.89% | Harvard lawsuit |
| ED boost average | 1.6x | Spark Admissions |
| QuestBridge match rate | 36% of finalists | QuestBridge 2024 |
| QuestBridge finalist avg GPA | 3.94 UW | QuestBridge 2024 |
| NACAC: Grades importance | 76.8% consider important | NACAC 2024 |
| NACAC: Test scores importance | 5% consider important | NACAC 2024 |
