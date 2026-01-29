# PASS Modular Knowledge Base Architecture

**Version:** 1.0
**Created:** January 2026
**Purpose:** Define the selective retrieval architecture for PASS research knowledge

---

## Executive Summary

This document defines the architecture for organizing PASS research into modular, selectively-retrievable components. The goal is to enable the AI system to:

1. **Pull specific information** when needed (not all at once)
2. **Quickly identify** which modules contain relevant research
3. **Maintain full depth** without losing any information
4. **Support context-efficient** portfolio analysis and workshops

---

## Design Principles

### 1. Topic-Based Modularity
Each file focuses on ONE specific topic with complete depth. No topic spans multiple files; no file covers multiple unrelated topics.

### 2. Consistent Structure
Every module follows the same template:
- Overview and key findings
- Detailed research content with citations
- School-specific information where applicable
- TypeScript interfaces for implementation
- Identified gaps
- Complete source list

### 3. Hierarchical Organization
```
docs/research/
├── MASTER_RETRIEVAL_INDEX.md          # Universal search across all modules
├── MODULAR_KNOWLEDGE_BASE_ARCHITECTURE.md  # This document
│
├── section1-activities/                # Activity Evaluation (modular)
│   ├── 1.1_QUANTITY_STANDARDS.md
│   ├── 1.2_TIME_COMMITMENT.md
│   ├── 1.3_DEPTH_VS_BREADTH.md
│   ├── 1.4_SPIKE_CONCEPT.md
│   ├── 1.5_IMPACT_ASSESSMENT.md
│   ├── 1.6_CONTEXT_CIRCUMSTANCES.md
│   ├── 1.7_ACTIVITY_CATEGORIES.md
│   └── SECTION_1_MASTER_INDEX.md
│
├── section3-character/                 # Character Assessment (modular)
│   ├── 3.1_INTELLECTUAL_CURIOSITY.md
│   ├── 3.2_RESILIENCE_GRIT.md
│   ├── 3.3_INTEGRITY_ETHICS.md
│   ├── 3.4_COMMUNITY_CONTRIBUTION.md
│   ├── 3.5_LEADERSHIP_POTENTIAL.md
│   ├── 3.6_SELF_AWARENESS_MATURITY.md
│   ├── 3.7_FIT_CAMPUS_CONTRIBUTION.md
│   └── SECTION_3_MASTER_INDEX.md
│
├── section4-red-flags/                 # Red Flag Detection (modular)
│   ├── 4.1_ACADEMIC_RED_FLAGS.md
│   ├── 4.2_ACTIVITY_RED_FLAGS.md
│   ├── 4.3_CHARACTER_INTEGRITY_RED_FLAGS.md
│   ├── 4.4_INCONSISTENCY_RED_FLAGS.md
│   ├── 4.5_APPLICATION_PROCESS_RED_FLAGS.md
│   └── SECTION_4_MASTER_INDEX.md
│
├── section5/                           # Holistic Review (already modular)
│   ├── 5.1_READING_PROCESS_AND_WORKFLOW.md
│   ├── 5.2_RATING_SYSTEMS_AND_SCALES.md
│   ├── 5.3_COMMITTEE_DECISION_MAKING.md
│   ├── 5.4_INSTITUTIONAL_PRIORITIES_AND_ALDC.md
│   ├── 5.5_ADVOCACY_AND_IT_FACTOR.md
│   └── SECTION_5_MASTER_INDEX.md
│
├── extracurricular-databases/          # Activity-specific evaluation (already modular)
│   ├── INDEX.md
│   ├── ROBOTICS.md
│   ├── DEBATE_SPEECH.md
│   ├── MODEL_UN.md
│   ├── STEM_RESEARCH.md
│   ├── THEATER_DRAMA.md
│   ├── CREATIVE_WRITING.md
│   ├── ENTREPRENEURSHIP.md
│   ├── HACKATHONS_CS.md
│   └── COMMUNITY_SERVICE.md
│
└── synthesis/                          # Original synthesis docs (preserved)
    ├── ACTIVITY_EVALUATION_FOUNDATION.md
    ├── CHARACTER_ASSESSMENT_FOUNDATION.md
    ├── RED_FLAGS_FOUNDATION.md
    └── HOLISTIC_REVIEW_FOUNDATION.md
```

### 4. Preservation Principle
Original synthesis documents are PRESERVED in `/synthesis/` for reference. Modular versions extract and organize the same content into searchable modules.

---

## Selective Retrieval Strategy

### When the System Needs Research

| Scenario | Retrieval Action |
|----------|------------------|
| Evaluating a debate activity | Load `extracurricular-databases/DEBATE_SPEECH.md` |
| Assessing intellectual curiosity | Load `section3-character/3.1_INTELLECTUAL_CURIOSITY.md` |
| Detecting activity red flags | Load `section4-red-flags/4.2_ACTIVITY_RED_FLAGS.md` |
| Understanding Harvard's rating system | Load `section5/5.2_RATING_SYSTEMS_AND_SCALES.md` |
| Assessing leadership potential | Load `section3-character/3.5_LEADERSHIP_POTENTIAL.md` |
| Evaluating spike potential | Load `section1-activities/1.4_SPIKE_CONCEPT.md` |

### Retrieval Decision Tree

```
START: What is the system analyzing?
│
├─ SPECIFIC ACTIVITY TYPE?
│  └─ YES → Load from extracurricular-databases/
│     ├─ Robotics → ROBOTICS.md
│     ├─ Debate/Speech → DEBATE_SPEECH.md
│     ├─ Model UN → MODEL_UN.md
│     ├─ Research/Science → STEM_RESEARCH.md
│     ├─ Theater → THEATER_DRAMA.md
│     ├─ Writing → CREATIVE_WRITING.md
│     ├─ Business/DECA → ENTREPRENEURSHIP.md
│     ├─ Coding/Hackathons → HACKATHONS_CS.md
│     └─ Service/Volunteering → COMMUNITY_SERVICE.md
│
├─ ACTIVITY PORTFOLIO ANALYSIS?
│  └─ YES → Load from section1-activities/
│     ├─ How many activities? → 1.1_QUANTITY_STANDARDS.md
│     ├─ Time investment? → 1.2_TIME_COMMITMENT.md
│     ├─ Depth vs breadth? → 1.3_DEPTH_VS_BREADTH.md
│     ├─ Has spike? → 1.4_SPIKE_CONCEPT.md
│     ├─ Impact level? → 1.5_IMPACT_ASSESSMENT.md
│     ├─ Context factors? → 1.6_CONTEXT_CIRCUMSTANCES.md
│     └─ Category evaluation? → 1.7_ACTIVITY_CATEGORIES.md
│
├─ CHARACTER ASSESSMENT?
│  └─ YES → Load from section3-character/
│     ├─ Intellectual engagement? → 3.1_INTELLECTUAL_CURIOSITY.md
│     ├─ Resilience/grit? → 3.2_RESILIENCE_GRIT.md
│     ├─ Integrity/ethics? → 3.3_INTEGRITY_ETHICS.md
│     ├─ Community contribution? → 3.4_COMMUNITY_CONTRIBUTION.md
│     ├─ Leadership potential? → 3.5_LEADERSHIP_POTENTIAL.md
│     ├─ Self-awareness/maturity? → 3.6_SELF_AWARENESS_MATURITY.md
│     └─ School fit? → 3.7_FIT_CAMPUS_CONTRIBUTION.md
│
├─ RED FLAG DETECTION?
│  └─ YES → Load from section4-red-flags/
│     ├─ Academic concerns? → 4.1_ACADEMIC_RED_FLAGS.md
│     ├─ Activity concerns? → 4.2_ACTIVITY_RED_FLAGS.md
│     ├─ Character/integrity? → 4.3_CHARACTER_INTEGRITY_RED_FLAGS.md
│     ├─ Inconsistencies? → 4.4_INCONSISTENCY_RED_FLAGS.md
│     └─ Application process? → 4.5_APPLICATION_PROCESS_RED_FLAGS.md
│
└─ ADMISSIONS PROCESS UNDERSTANDING?
   └─ YES → Load from section5/
      ├─ Reading process? → 5.1_READING_PROCESS_AND_WORKFLOW.md
      ├─ Rating systems? → 5.2_RATING_SYSTEMS_AND_SCALES.md
      ├─ Committee decisions? → 5.3_COMMITTEE_DECISION_MAKING.md
      ├─ ALDC/hooks? → 5.4_INSTITUTIONAL_PRIORITIES_AND_ALDC.md
      └─ Advocacy/it factor? → 5.5_ADVOCACY_AND_IT_FACTOR.md
```

---

## Module Template

Every modular file follows this structure:

```markdown
# [Section.Subsection] [Topic Name]

**Section:** [Parent section]
**Last Updated:** [Date]
**Status:** Complete
**Citations:** [Count]

---

## Table of Contents

[Auto-generated based on sections]

---

## Overview

[2-3 paragraph summary of key findings]

### Key Takeaways
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

---

## [Main Content Sections]

### [Subtopic 1]

[Detailed content with citations]

> "Quote from authority"
> — [Source Name]

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |

### [Subtopic 2]

[Continue pattern...]

---

## School-Specific Information

### Harvard
[Specific findings]

### Stanford
[Specific findings]

### MIT
[Specific findings]

### Yale/Princeton
[Specific findings]

---

## TypeScript Interfaces

```typescript
interface [TopicName]Assessment {
  // Implementation-ready interface
}
```

---

## Cross-References

- Related: [Link to related module]
- See also: [Link to related module]

---

## Identified Gaps

1. [Gap that needs future research]
2. [Gap that needs future research]

---

## Sources

1. [Full citation with URL where available]
2. [Full citation with URL where available]
[Continue...]
```

---

## Module Specifications by Section

### Section 1: Activity Evaluation

| Module | Primary Focus | Key Content |
|--------|--------------|-------------|
| **1.1** | Activity quantity | Optimal ranges, MIT 4-limit, padding detection |
| **1.2** | Time commitment | Hours thresholds, credibility ceiling, summer hierarchy |
| **1.3** | Depth vs breadth | Depth signals, progressive leadership, impact metrics |
| **1.4** | Spike concept | Definition, identification, STEM vs liberal arts |
| **1.5** | Impact assessment | Quantification thresholds, evidence hierarchy |
| **1.6** | Context & circumstances | Resource constraints, first-gen, geographic factors |
| **1.7** | Activity categories | Institutional preferences, tier system, category weights |

### Section 3: Character Assessment

| Module | Primary Focus | Key Content |
|--------|--------------|-------------|
| **3.1** | Intellectual curiosity | 8x advantage, IV rating, evidence domains |
| **3.2** | Resilience & grit | Three-lens framework, failure essays, privilege context |
| **3.3** | Integrity & ethics | Disciplinary records, authenticity signals |
| **3.4** | Community contribution | Service evaluation, impact vs hours |
| **3.5** | Leadership potential | Beyond titles, influence patterns |
| **3.6** | Self-awareness & maturity | Reflection quality, growth mindset |
| **3.7** | Fit & campus contribution | "Will I want to live with..." test |

### Section 4: Red Flag Detection

| Module | Primary Focus | Key Content |
|--------|--------------|-------------|
| **4.1** | Academic red flags | Grade trends, rigor avoidance, integrity violations |
| **4.2** | Activity red flags | Sudden explosion, paper orgs, thematic incoherence |
| **4.3** | Character/integrity | Disciplinary history, social media, inauthenticity |
| **4.4** | Inconsistencies | Cross-component analysis, verification methods |
| **4.5** | Application process | Demonstrated interest, process violations |

### Section 5: Holistic Review (Already Complete)

| Module | Primary Focus | Key Content |
|--------|--------------|-------------|
| **5.1** | Reading process | Time allocation, regional officers, first reader |
| **5.2** | Rating systems | Harvard 1-6, Stanford IV, MIT reversed |
| **5.3** | Committee decisions | Subcommittee, full committee, borderline factors |
| **5.4** | Institutional priorities | ALDC, 85% qualified, class shaping |
| **5.5** | Advocacy & it factor | DNS/LMO codes, pitch test, reader attachment |

---

## Keyword Index Design

Each section's Master Index contains:

### Alphabetical Keyword Index
```
A
- Academic Rating: 5.2 lines 45-120
- ALDC Categories: 5.4 lines 23-89
- Advocacy Model: 5.5 lines 34-67

B
- Borderline Tipping: 5.3 lines 156-201
...
```

### Quick Reference Tables
```
| Topic | Module | Lines |
|-------|--------|-------|
| Harvard Personal Rating | 5.2 | 78-95 |
| Stanford IV | 5.2 | 120-145 |
...
```

### Cross-Module References
```
Topic: Leadership
- Activity evaluation: 1.3, 1.5
- Character assessment: 3.5
- Red flag detection: 4.2
- Holistic review: 5.5
```

---

## Implementation Notes

### Context Window Efficiency

| Retrieval Scenario | Estimated Tokens | Full Section Alternative |
|-------------------|------------------|-------------------------|
| Single module | 3,000-8,000 | N/A |
| Two related modules | 6,000-15,000 | N/A |
| Full section (all modules) | 25,000-40,000 | 25,000-40,000 |
| Targeted retrieval (3 modules) | 10,000-20,000 | Would need full section |

### Retrieval Priority Rules

1. **Always start with Master Index** to identify relevant modules
2. **Load only modules needed** for current analysis
3. **Prefer specific extracurricular database** over general activity modules
4. **Cross-reference red flags** when evaluating any component
5. **Load Section 5 modules** when explaining admissions context

### Caching Strategy

For workshop sessions:
- Pre-load relevant extracurricular databases based on student's activities
- Cache character assessment modules used in feedback
- Keep red flag modules accessible for cross-validation

---

## Migration Checklist

### Phase 1: Architecture (This Document) ✅

### Phase 2: Section 1 Restructuring
- [ ] Extract 1.1 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Extract 1.2 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Extract 1.3 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Extract 1.4 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Extract 1.5 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Extract 1.6 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Extract 1.7 from ACTIVITY_EVALUATION_FOUNDATION.md
- [ ] Create SECTION_1_MASTER_INDEX.md

### Phase 3: Section 3 Restructuring
- [ ] Extract 3.1 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Extract 3.2 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Extract 3.3 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Extract 3.4 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Extract 3.5 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Extract 3.6 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Extract 3.7 from CHARACTER_ASSESSMENT_FOUNDATION.md
- [ ] Create SECTION_3_MASTER_INDEX.md

### Phase 4: Section 4 Restructuring
- [ ] Extract 4.1 from RED_FLAGS_FOUNDATION.md
- [ ] Extract 4.2 from RED_FLAGS_FOUNDATION.md
- [ ] Extract 4.3 from RED_FLAGS_FOUNDATION.md
- [ ] Extract 4.4 from RED_FLAGS_FOUNDATION.md
- [ ] Extract 4.5 from RED_FLAGS_FOUNDATION.md
- [ ] Create SECTION_4_MASTER_INDEX.md

### Phase 5: Section 5 Verification ✅
- [x] 5.1 Reading Process exists
- [x] 5.2 Rating Systems exists
- [x] 5.3 Committee Decisions exists
- [x] 5.4 Institutional Priorities exists
- [x] 5.5 Advocacy and It Factor exists
- [x] Master Index exists

### Phase 6: Master Retrieval Index
- [ ] Create MASTER_RETRIEVAL_INDEX.md
- [ ] Include cross-section keyword search
- [ ] Add module dependency map
- [ ] Add common retrieval patterns

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial architecture document |

---

## Next Steps

1. Create Section 1 modular components (7 modules + index)
2. Create Section 3 modular components (7 modules + index)
3. Create Section 4 modular components (5 modules + index)
4. Create unified Master Retrieval Index
5. Update system retrieval logic to use modular structure
