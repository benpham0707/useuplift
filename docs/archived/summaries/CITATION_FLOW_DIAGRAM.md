# 📊 Citation Exposure System - Visual Flow Diagrams

## 🎯 Complete System Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         COLLEGE RESEARCH DATABASE                          │
│                                                                            │
│  📚 Stanford Research                                                      │
│     ├─ Core Values (40% Intellectual Vitality, 25% Impact, ...)          │
│     ├─ Key Quotes (Dean Shaw, AO interviews, ...)                        │
│     ├─ Red Flags (CLASS_BASED_ONLY, VAGUE_PASSION, ...)                 │
│     ├─ Green Flags (SELF_DIRECTED_EXPLORATION, ...)                     │
│     └─ Elite Examples (STAN_IV_001, STAN_IV_007, ...)                   │
│                                                                            │
│  📚 MIT Research                                                           │
│  📚 Harvard Research                                                       │
│  ... (other colleges)                                                      │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓ Loaded into context
                                    ↓
┌───────────────────────────────────────────────────────────────────────────┐
│                    STAGE 2: SURGICAL TEACHING (SONNET)                     │
│                                                                            │
│  INPUT:                                                                    │
│  • Student essay draft                                                     │
│  • 2-3 critical issues (from Stage 1)                                     │
│  • Voice fingerprint                                                       │
│  • Full college research (cached 95% discount)                            │
│  • Citation mapping from Haiku (which quotes apply where)                 │
│                                                                            │
│  PROMPT INSTRUCTIONS:                                                      │
│  "Generate 2 suggestions per issue. Cite ALL sources inline using         │
│   [cited text]{{cite_N}} format. Build citation database with:            │
│   - Source metadata (name, title, publication)                            │
│   - Evidence (quote, flag, value, example)                                │
│   - Why relevant to this suggestion                                       │
│   - Research ID for traceability"                                         │
│                                                                            │
│  OUTPUT:                                                                   │
│  {                                                                         │
│    "issues": [                                                             │
│      {                                                                     │
│        "issue_number": 1,                                                  │
│        "suggestions": {                                                    │
│          "polished_original": {                                            │
│            "text_with_citations": "...[cited]{{cite_1}}...",              │
│            "rationale_with_citations": "...[cited]{{cite_2}}...",         │
│            "citations": {                                                  │
│              "cite_1": { full citation object },                           │
│              "cite_2": { full citation object }                            │
│            }                                                                │
│          },                                                                │
│          "voice_amplifier": { ... }                                        │
│        }                                                                   │
│      }                                                                     │
│    ]                                                                       │
│  }                                                                         │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓ Validate & enrich
                                    ↓
┌───────────────────────────────────────────────────────────────────────────┐
│                        CITATION PROCESSOR SERVICE                          │
│                                                                            │
│  STEP 1: Extract citation IDs from text                                   │
│  "Stanford values [self-directed exploration]{{cite_1}}"                  │
│  → Found: ["cite_1"]                                                       │
│                                                                            │
│  STEP 2: Validate all IDs resolve                                         │
│  cite_1 exists in citations database? ✓                                   │
│  cite_2 exists in citations database? ✓                                   │
│  All citations used in database? ✓                                        │
│                                                                            │
│  STEP 3: Enrich citations with full research data                         │
│  citation.research_id = "stanford_shaw_iv_quote_3"                        │
│  → Look up in research DB                                                 │
│  → Add full quote text, all evidence, context                             │
│                                                                            │
│  STEP 4: Generate UI-ready format                                         │
│  Convert to tooltip content, styling hints, accessibility labels          │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓ Send to frontend
                                    ↓
┌───────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND UI                                   │
│                                                                            │
│  STEP 1: Parse text with citation markers                                 │
│  Input: "Stanford values [self-directed exploration]{{cite_1}}"           │
│  Output:                                                                   │
│    [                                                                       │
│      { text: "Stanford values ", citation_id: null },                     │
│      { text: "self-directed exploration", citation_id: "cite_1" }         │
│    ]                                                                       │
│                                                                            │
│  STEP 2: Render with hover tooltips                                       │
│  <span>                                                                    │
│    Stanford values                                                         │
│    <Tooltip content={citations['cite_1']}>                                │
│      <Highlight>self-directed exploration</Highlight>                     │
│    </Tooltip>                                                              │
│  </span>                                                                   │
│                                                                            │
│  STEP 3: Show tooltip on hover                                            │
│  ╔═══════════════════════════════════════╗                                │
│  ║ Dean Richard Shaw                     ║                                │
│  ║ Dean of Admission, Stanford           ║                                │
│  ║───────────────────────────────────────║                                │
│  ║ "We want students who pursue their    ║                                │
│  ║  curiosity beyond requirements..."    ║                                │
│  ║                                       ║                                │
│  ║ Why this matters:                     ║                                │
│  ║ Establishes what Stanford means by    ║                                │
│  ║ intellectual vitality                 ║                                │
│  ╚═══════════════════════════════════════╝                                │
└───────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Citation Types - Detailed Examples

### 1️⃣ QUOTE Citation (Dean/AO)

```typescript
{
  "cite_1": {
    "id": "cite_1",
    "type": "quote",

    "source": {
      "name": "Dean Richard Shaw",
      "title": "Dean of Admission and Financial Aid",
      "publication": "Stanford Magazine",
      "date": "2023-09"
    },

    "evidence": {
      "quote": "We're not looking for students who just succeed in
                structured environments. We want students who create
                their own learning opportunities.",
      "context": "Interview about what Stanford values most in essays"
    },

    "why_relevant": "Direct evidence that Stanford prioritizes
                     self-directed learning over classroom achievement",

    "research_id": "stanford_shaw_quote_iv_3"
  }
}
```

**In teaching text**:
```
"Stanford specifically looks for students who [create their own learning
opportunities]{{cite_1}}, not just succeed in class."
```

**Tooltip renders**:
```
╔═══════════════════════════════════════╗
║ 🎓 Dean Richard Shaw                  ║
║ Dean of Admission and Financial Aid   ║
║ Stanford Magazine, Sept 2023          ║
║───────────────────────────────────────║
║ "We're not looking for students who   ║
║  just succeed in structured           ║
║  environments. We want students who   ║
║  create their own learning            ║
║  opportunities."                      ║
║                                       ║
║ 💡 Why this matters:                  ║
║ Direct evidence that Stanford         ║
║ prioritizes self-directed learning    ║
║ over classroom achievement            ║
╚═══════════════════════════════════════╝
```

---

### 2️⃣ RED FLAG Citation

```typescript
{
  "cite_2": {
    "id": "cite_2",
    "type": "red_flag",

    "source": {
      "name": "Stanford Red Flag System",
      "title": "CLASS_BASED_ONLY"
    },

    "evidence": {
      "flag_name": "Classroom-Bounded Learning",
      "context": "Severity: MAJOR - Learning activities never extend
                  beyond structured classroom environment. Caps score
                  at 69 for Intellectual Vitality dimension."
    },

    "why_relevant": "Original draft shows this exact pattern - all
                     learning happens in class with no self-directed
                     extension",

    "research_id": "stanford_red_flag_class_based"
  }
}
```

**In teaching text**:
```
"Your original draft triggers the [classroom-bounded learning]{{cite_2}}
red flag because all activities happen in structured environments."
```

**Tooltip renders**:
```
╔═══════════════════════════════════════╗
║ 🚨 RED FLAG: CLASS_BASED_ONLY         ║
║ Classroom-Bounded Learning            ║
║───────────────────────────────────────║
║ Severity: MAJOR                       ║
║                                       ║
║ Learning activities never extend      ║
║ beyond structured classroom           ║
║ environment.                          ║
║                                       ║
║ 📉 Score Impact:                      ║
║ Caps Intellectual Vitality at 69      ║
║                                       ║
║ ⚠️  Why this matters:                 ║
║ Your draft shows this exact pattern - ║
║ all learning in class, no             ║
║ self-directed extension               ║
╚═══════════════════════════════════════╝
```

---

### 3️⃣ GREEN FLAG Citation

```typescript
{
  "cite_3": {
    "id": "cite_3",
    "type": "green_flag",

    "source": {
      "name": "Stanford Green Flag System",
      "title": "INDEPENDENT_PROJECT_EXTENSION"
    },

    "evidence": {
      "flag_name": "Self-Directed Project Extension",
      "context": "Strength: EXCEPTIONAL - Student takes classroom
                  concept and builds independent project that explores
                  it deeply. Supports 85+ scoring."
    },

    "why_relevant": "This revision demonstrates the exact pattern
                     Stanford rewards: classroom → independent project",

    "research_id": "stanford_green_flag_project_extension"
  }
}
```

**In teaching text**:
```
"By showing you [took the Python concept from class and built an
independent web scraper]{{cite_3}}, you demonstrate self-directed
exploration."
```

**Tooltip renders**:
```
╔═══════════════════════════════════════╗
║ ✅ GREEN FLAG DETECTED                 ║
║ Self-Directed Project Extension       ║
║───────────────────────────────────────║
║ Strength: EXCEPTIONAL                 ║
║                                       ║
║ Student takes classroom concept and   ║
║ builds independent project that       ║
║ explores it deeply.                   ║
║                                       ║
║ 📈 Score Impact:                      ║
║ Supports 85+ scoring                  ║
║                                       ║
║ 💪 Why this matters:                  ║
║ This revision demonstrates the exact  ║
║ pattern Stanford rewards: classroom   ║
║ learning → independent project        ║
╚═══════════════════════════════════════╝
```

---

### 4️⃣ VALUE Citation

```typescript
{
  "cite_4": {
    "id": "cite_4",
    "type": "value",

    "source": {
      "name": "Stanford Core Values",
      "title": "Intellectual Vitality"
    },

    "evidence": {
      "value_name": "Self-Directed Exploration",
      "context": "Highest-weighted value at Stanford (40% of total).
                  Defined as pursuing learning for its own sake,
                  independent of requirements or grades."
    },

    "why_relevant": "This is THE primary value Stanford evaluates in
                     intellectual vitality essays",

    "research_id": "stanford_value_intellectual_vitality"
  }
}
```

**In teaching text**:
```
"This demonstrates [intellectual vitality through self-directed
exploration]{{cite_4}}, Stanford's top-weighted value at 40%."
```

**Tooltip renders**:
```
╔═══════════════════════════════════════╗
║ 💎 STANFORD CORE VALUE                ║
║ Intellectual Vitality                 ║
║───────────────────────────────────────║
║ Self-Directed Exploration             ║
║                                       ║
║ Weight: 40% (highest at Stanford)     ║
║                                       ║
║ 📖 Definition:                        ║
║ Pursuing learning for its own sake,   ║
║ independent of requirements or        ║
║ grades.                               ║
║                                       ║
║ 🎯 Why this matters:                  ║
║ This is THE primary value Stanford    ║
║ evaluates in intellectual vitality    ║
║ essays                                ║
╚═══════════════════════════════════════╝
```

---

### 5️⃣ EXAMPLE Citation

```typescript
{
  "cite_5": {
    "id": "cite_5",
    "type": "example",

    "source": {
      "name": "Elite Example: STAN_IV_007",
      "title": "Successful Stanford IV Essay (Score: 92)"
    },

    "evidence": {
      "quote": "Built web scraper that analyzed sentiment in 50,000
                Reddit mental health posts to understand language
                patterns in depression discussions",
      "context": "Student demonstrated technical depth + independent
                  research + social impact all at once"
    },

    "why_relevant": "Shows exact technique for transforming classroom
                     skill into independent project with real purpose",

    "research_id": "stanford_example_iv_007"
  }
}
```

**In teaching text**:
```
"Notice how this [combines technical project with real-world research
purpose]{{cite_5}}, similar to elite examples that score 90+."
```

**Tooltip renders**:
```
╔═══════════════════════════════════════╗
║ 🌟 ELITE EXAMPLE                      ║
║ STAN_IV_007 (Score: 92/100)           ║
║───────────────────────────────────────║
║ "Built web scraper that analyzed      ║
║  sentiment in 50,000 Reddit mental    ║
║  health posts..."                     ║
║                                       ║
║ 🎓 What worked:                       ║
║ Student demonstrated technical depth  ║
║ + independent research + social       ║
║ impact all at once                    ║
║                                       ║
║ 💡 Technique to learn:                ║
║ Shows how to transform classroom      ║
║ skill into independent project with   ║
║ real purpose                          ║
╚═══════════════════════════════════════╝
```

## 🔄 Complete Example: Issue → Teaching → UI

### 📝 ORIGINAL DRAFT (ISSUE)

```
"I learned about Python programming in my AP Computer Science class.
We studied algorithms and data structures. I found it very interesting
and got an A in the class."
```

**Problem**: Classroom-bounded (red flag), no self-directed exploration

---

### 💡 TEACHING OUTPUT (WITH CITATIONS)

```json
{
  "issue_number": 1,
  "issue_quote": "I learned about Python in my AP CS class...",
  "diagnosis_summary": "CLASS_BASED_ONLY red flag - learning never extends beyond classroom",

  "suggestions": {
    "polished_original": {
      "text_with_citations": "I discovered Python through AP Computer Science,
      then spent weekends building [a web scraper that analyzed Reddit mental
      health discussions]{{cite_1}} to understand [how language patterns differ
      in depression communities]{{cite_2}}. The project started when I noticed
      [classroom exercises taught syntax but not real applications]{{cite_3}},
      and I wanted to use code to understand something that mattered to me.",

      "rationale_with_citations": "This revision transforms
      [classroom-bounded learning]{{cite_4}} into [self-directed
      exploration]{{cite_5}} by showing you [pursued Python beyond
      requirements]{{cite_6}}. Stanford specifically looks for students who
      [can't help but take ideas and run with them independently]{{cite_7}},
      which is their [top-weighted value at 40%]{{cite_8}}. The mental health
      angle adds [authentic personal connection]{{cite_9}} rather than generic
      'found it interesting.'",

      "citations": {
        "cite_1": {
          "type": "example",
          "source": { "name": "Elite Example STAN_IV_007" },
          "evidence": {
            "quote": "Built web scraper for Reddit analysis",
            "context": "Shows specific technical + research project"
          },
          "why_relevant": "Demonstrates technical depth + independence"
        },
        "cite_2": {
          "type": "green_flag",
          "source": { "name": "Stanford Green Flag: RESEARCH_DRIVEN_PROJECT" },
          "evidence": {
            "flag_name": "Research-Driven Technical Project",
            "context": "Using technical skills to investigate genuine question"
          },
          "why_relevant": "Shows curiosity driving technical work"
        },
        "cite_3": {
          "type": "quote",
          "source": {
            "name": "Dean Richard Shaw",
            "title": "Dean of Admission",
            "publication": "Stanford Daily"
          },
          "evidence": {
            "quote": "Students who notice gaps and fill them themselves -
                     that's what we mean by intellectual vitality",
            "context": "Describing ideal Stanford student"
          },
          "why_relevant": "Shows exactly what insight triggers IV"
        },
        "cite_4": {
          "type": "red_flag",
          "source": { "name": "Stanford Red Flag: CLASS_BASED_ONLY" },
          "evidence": {
            "flag_name": "Classroom-Bounded Learning",
            "context": "Major severity - caps score at 69"
          },
          "why_relevant": "What original draft suffered from"
        },
        "cite_5": {
          "type": "value",
          "source": { "name": "Stanford Core Value: Intellectual Vitality" },
          "evidence": {
            "value_name": "Self-Directed Exploration",
            "context": "Weight: 40% - highest at Stanford"
          },
          "why_relevant": "Primary value being demonstrated"
        },
        "cite_6": {
          "type": "green_flag",
          "source": { "name": "Stanford Green Flag: PROJECT_EXTENSION" },
          "evidence": {
            "flag_name": "Independent Project Extension",
            "context": "Takes class concept → independent work"
          },
          "why_relevant": "Pattern revision demonstrates"
        },
        "cite_7": {
          "type": "quote",
          "source": {
            "name": "Dean Richard Shaw",
            "title": "Dean of Admission",
            "publication": "Stanford Magazine"
          },
          "evidence": {
            "quote": "We want students who pursue curiosity beyond requirements",
            "context": "Core IV philosophy"
          },
          "why_relevant": "Defines what Stanford seeks"
        },
        "cite_8": {
          "type": "value",
          "source": { "name": "Stanford Value Weights" },
          "evidence": {
            "value_name": "Intellectual Vitality",
            "context": "40% weight - top priority"
          },
          "why_relevant": "Shows importance of this value"
        },
        "cite_9": {
          "type": "green_flag",
          "source": { "name": "Stanford Green Flag: AUTHENTIC_MOTIVATION" },
          "evidence": {
            "flag_name": "Genuine Personal Connection",
            "context": "Real reason for interest, not generic"
          },
          "why_relevant": "Mental health angle shows authentic drive"
        }
      }
    }
  }
}
```

---

### 🎨 UI RENDERING

**Suggestion text** (with hover areas highlighted):
```
I discovered Python through AP Computer Science, then spent weekends
building [a web scraper that analyzed Reddit mental health discussions]
                                                                   ↑
                                                        [hover shows EXAMPLE]
to understand [how language patterns differ in depression communities].
                                                                     ↑
                                                          [hover shows GREEN FLAG]
The project started when I noticed [classroom exercises taught syntax
but not real applications], and I wanted to use code to understand
              ↑
   [hover shows QUOTE]
something that mattered to me.
```

**Rationale text** (with hover areas highlighted):
```
This revision transforms [classroom-bounded learning] into
                                ↑
                     [hover shows RED FLAG]

[self-directed exploration] by showing you [pursued Python beyond
         ↑                                            ↑
  [hover shows VALUE]                    [hover shows GREEN FLAG]

requirements]. Stanford specifically looks for students who [can't help
but take ideas and run with them independently], which is their
                                    ↑
                         [hover shows QUOTE]

[top-weighted value at 40%].
          ↑
   [hover shows VALUE WEIGHT]
```

## 📊 Citation Quality Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│               CITATION QUALITY SCORECARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Citation Coverage:        97% (32/33 claims cited) ✅       │
│  Citation Accuracy:       100% (all IDs resolve)    ✅       │
│  Missing Citations:         1   (moderate concern)  ⚠️       │
│  Unused Citations:          0   (no waste)          ✅       │
│                                                              │
│  Citation Type Breakdown:                                    │
│    • Quotes:        8  (42%)  ████████████░░░░░░░░░         │
│    • Values:        6  (32%)  ██████████░░░░░░░░░░░         │
│    • Red Flags:     3  (16%)  █████░░░░░░░░░░░░░░░░         │
│    • Green Flags:   2  ( 5%)  ██░░░░░░░░░░░░░░░░░░░         │
│    • Examples:      1  ( 5%)  ██░░░░░░░░░░░░░░░░░░░         │
│                                                              │
│  Source Diversity:                                           │
│    • Dean Shaw:         5 citations                          │
│    • Core Values:       6 citations                          │
│    • Flag System:       5 citations                          │
│    • Elite Examples:    1 citation                           │
│                                                              │
│  Cost Impact:          +$0.008 per essay                     │
│  User Engagement:      78% hover rate (citations used!)      │
└─────────────────────────────────────────────────────────────┘
```

---

**🎉 Result**: Every claim in teaching has transparent source that students can verify!
