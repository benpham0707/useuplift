# 📚 Citation Exposure System - Executive Summary

## 🎯 What We're Building

A transparent, evidence-backed teaching system where **every claim has a source** that students can see via hover tooltips.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  CLAUDE GENERATES SUGGESTIONS WITH INLINE CITATIONS         │
│                                                              │
│  "Stanford values [self-directed exploration]{{cite_1}},    │
│   not just [classroom achievement]{{cite_2}}."              │
│                                                              │
│  + Citation Database:                                       │
│    cite_1 → Dean Shaw quote about intellectual vitality    │
│    cite_2 → Red flag: classroom-bounded learning            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND VALIDATES & ENRICHES CITATIONS                      │
│                                                              │
│  ✓ All citation IDs resolve to sources                      │
│  ✓ All sources have complete metadata                       │
│  ✓ Citations enriched with full research context            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  UI RENDERS INTERACTIVE TEXT WITH HOVER TOOLTIPS             │
│                                                              │
│  User hovers over "self-directed exploration" →              │
│                                                              │
│  ╔═══════════════════════════════════════╗                  │
│  ║ Dean Richard Shaw                     ║                  │
│  ║ Dean of Admission, Stanford           ║                  │
│  ║───────────────────────────────────────║                  │
│  ║ "We want students who pursue their    ║                  │
│  ║  curiosity beyond requirements..."    ║                  │
│  ║                                       ║                  │
│  ║ Why this matters: Establishes what    ║                  │
│  ║ Stanford means by intellectual        ║                  │
│  ║ vitality                              ║                  │
│  ╚═══════════════════════════════════════╝                  │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Citation Format

### In Teaching Text
```
[cited phrase]{{citation_id}}
```

Example:
```typescript
text_with_citations: "Stanford specifically looks for students who
[take ideas from class and run with them independently]{{cite_3}},
not just [excel in structured coursework]{{cite_4}}."
```

### In Citation Database
```typescript
{
  "cite_3": {
    "type": "quote",
    "source": {
      "name": "Dean Richard Shaw",
      "title": "Dean of Admission and Financial Aid",
      "publication": "Stanford Magazine"
    },
    "evidence": {
      "quote": "We want students who can't help but pursue their curiosity...",
      "context": "Explaining Stanford's intellectual vitality standard"
    },
    "why_relevant": "Direct evidence of what Stanford values"
  },
  "cite_4": {
    "type": "red_flag",
    "source": {
      "name": "Stanford Red Flag: CLASS_BASED_ONLY"
    },
    "evidence": {
      "flag_name": "Classroom-Bounded Learning",
      "context": "Severity: Major - Learning never leaves classroom"
    },
    "why_relevant": "Shows what the original draft was missing"
  }
}
```

## 🔑 Key Features

### 5 Citation Types

1. **`quote`** - Direct quotes from deans, admissions officers
   - Source: Person name, title, publication
   - Evidence: Full quote + context

2. **`red_flag`** - College-specific problems detected
   - Source: Red flag system
   - Evidence: Flag name, severity, why it matters

3. **`green_flag`** - College-specific strengths recognized
   - Source: Green flag system
   - Evidence: Flag name, strength level, why valued

4. **`value`** - Core college values
   - Source: College research
   - Evidence: Value name, definition, weight

5. **`example`** - Elite example essays
   - Source: Example ID
   - Evidence: Technique demonstrated, why it works

## 📊 Example: Complete Citation Flow

### Original Draft (Problem)
```
"I learned about Python in my computer science class and it was very interesting."
```

### Suggestion with Citations
```
"I discovered Python through CS50, then spent weekends building
[a web scraper that analyzed Reddit discussions]{{cite_1}} to understand
how people talk about mental health online. The project started when I
noticed [classroom exercises focused on syntax but ignored real-world
applications]{{cite_2}}."
```

### Citation Database
```json
{
  "cite_1": {
    "type": "example",
    "source": {
      "name": "Elite Example STAN_IV_007",
      "title": "Successful Stanford Intellectual Vitality Essay"
    },
    "evidence": {
      "quote": "Built web scraper as personal project",
      "context": "Example demonstrates specific technical project + independence"
    },
    "why_relevant": "Shows how to transform classroom learning into self-directed work"
  },
  "cite_2": {
    "type": "quote",
    "source": {
      "name": "Dean Richard Shaw",
      "title": "Dean of Admission and Financial Aid",
      "publication": "Stanford Magazine",
      "date": "2023"
    },
    "evidence": {
      "quote": "We're not looking for students who just succeed in structured
               environments. We want students who create their own learning
               opportunities.",
      "context": "Interview about what Stanford values in essays"
    },
    "why_relevant": "Explains why classroom-only narrative is weak"
  }
}
```

### Rationale with Citations
```
"This revision transforms [classroom learning]{{cite_3}} into
[self-directed exploration]{{cite_4}} by showing you [pursued the idea
beyond requirements]{{cite_5}}. Stanford specifically looks for students who
[can't help but take ideas and run with them]{{cite_6}}, which is their
top-weighted value at [40% of intellectual vitality]{{cite_7}}."
```

## 💪 Benefits

### For Students
- **Transparency**: See exactly why advice is given
- **Trust**: Every claim backed by authoritative source
- **Learning**: Understand college values through real quotes
- **Confidence**: Know advice comes from actual admissions officers

### For Quality
- **Accountability**: Claude must ground teaching in evidence
- **Accuracy**: Forces teaching to stay aligned with research
- **Consistency**: Citations ensure no contradictions
- **Debugging**: Easy to trace advice back to source

### For Development
- **Testability**: Validate citation completeness automatically
- **Observability**: Track which sources are used most often
- **Iteration**: Identify gaps in research coverage
- **Quality Metrics**: Measure teaching accuracy

## 📈 Implementation Phases

### Phase 1: Prompt Engineering (1-2 hours)
- Update batch generation prompts to output inline citations
- Add citation database to output schema
- Create citation examples for Claude

### Phase 2: Type System (1 hour)
- Create `citationTypes.ts` with core types
- Extend `Suggestion` interface with citations
- Update service outputs

### Phase 3: Parser & Validator (2-3 hours)
- Build citation parser (extract IDs from text)
- Build citation validator (check IDs resolve)
- Build citation enricher (add full research data)

### Phase 4: UI Integration (1 hour)
- Create UI-ready format converter
- Generate tooltip content
- Add styling hints and accessibility

### Phase 5: Testing (2 hours)
- Test citation generation
- Test validation logic
- Test UI format conversion
- Run end-to-end with real essays

**Total**: 7-9 hours

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Citation Coverage | >95% | % of claims with citations |
| Citation Accuracy | 100% | % of IDs resolving to valid sources |
| Cost Impact | <$0.01/essay | Token increase for citations |
| User Engagement | Track | Hover interaction rate |
| Quality Improvement | Measure | Does citation requirement improve teaching? |

## 🚨 Risk Mitigation

### Prompt Complexity (+300 tokens)
- **Risk**: Longer prompts cost more
- **Mitigation**: Cache prompt with examples, worth $0.006 for transparency

### Claude Consistency
- **Risk**: May forget to cite some claims
- **Mitigation**: Validation layer catches missing citations, prompts retry

### UI Parsing
- **Risk**: Frontend must parse citation markers
- **Mitigation**: Provide clean parsing utility + thorough documentation

## 🎨 UI Example Flow

```typescript
// Backend sends:
{
  text_with_citations: "Stanford values [self-directed exploration]{{cite_1}}",
  citations: {
    "cite_1": {
      type: "value",
      source: { name: "Stanford Core Value", title: "Intellectual Vitality" },
      evidence: { value_name: "Self-Directed Exploration", ... },
      why_relevant: "Primary value being demonstrated"
    }
  }
}

// Frontend parses and renders:
<span>
  Stanford values
  <Tooltip content={renderCitation(citations['cite_1'])}>
    <Highlight>self-directed exploration</Highlight>
  </Tooltip>
</span>

// User sees on hover:
┌─────────────────────────────────┐
│ Stanford Core Value             │
│ Intellectual Vitality           │
├─────────────────────────────────┤
│ Self-Directed Exploration       │
│                                 │
│ Why this matters:               │
│ Primary value being             │
│ demonstrated in this revision   │
└─────────────────────────────────┘
```

## 🎉 What Makes This Powerful

1. **Evidence-Based Teaching**: Every piece of advice grounded in real admissions philosophy
2. **Transparent AI**: Students see exactly where advice comes from
3. **Quality Forcing Function**: Claude can't make claims without backing them up
4. **Educational Value**: Students learn college values through authentic sources
5. **Trust Building**: Demonstrates that system is research-backed, not guessing

## 📚 Documentation Deliverables

1. **Technical Spec**: `CITATION_EXPOSURE_PLAN.md` (detailed implementation)
2. **This Summary**: Quick overview for stakeholders
3. **Type Definitions**: Full TypeScript interfaces
4. **UI Integration Guide**: For frontend team
5. **Testing Protocol**: Validation and quality checks

---

**Ready to implement?** The plan is complete with:
- ✅ Existing infrastructure analysis
- ✅ Citation format design
- ✅ Complete type system
- ✅ Parser/validator architecture
- ✅ UI integration specification
- ✅ Testing strategy
- ✅ Risk assessment
- ✅ Success metrics
