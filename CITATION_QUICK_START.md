# 📚 Citation System - Quick Start Guide

## 🎯 What Is This?

The citation system makes every piece of teaching **transparent** by showing students the exact evidence behind each claim. When users hover over highlighted text, they see tooltips with the source (Dean quotes, red flags, values, etc.).

---

## 🚀 Quick Example

**What the backend sends**:
```typescript
{
  text_with_citations: "Stanford values [self-directed exploration]{{cite_1}}",
  citations: {
    "cite_1": {
      type: "value",
      source: { name: "Stanford Core Values", title: "Intellectual Vitality" },
      evidence: { value_name: "Self-Directed Exploration", weight: 40, ... },
      why_relevant: "Primary value being demonstrated"
    }
  }
}
```

**What the user sees**:
```
Stanford values [self-directed exploration]
                       ↑ hover here
```

**Tooltip appears**:
```
╔═══════════════════════════════════════╗
║ 💎 Self-Directed Exploration          ║
║ Stanford Core Value (40% weight)      ║
║───────────────────────────────────────║
║ Pursuing learning for its own sake    ║
║                                       ║
║ Why this matters:                     ║
║ Primary value being demonstrated      ║
╚═══════════════════════════════════════╝
```

---

## 📦 What Was Built

1. **Citation Types** - 5 types: quote, red_flag, green_flag, value, example
2. **Citation Processor** - Parse, validate, enrich citations
3. **Citation Formatter** - Convert to UI-ready tooltip format
4. **26 Tests** - All passing ✅

---

## 💻 Backend Usage

### Import

```typescript
import { citationProcessor } from '@/services/commonAppWorkshop/services/citationProcessor';
import { formatTextWithCitations } from '@/services/commonAppWorkshop/utils/citationFormatter';
```

### Parse & Validate

```typescript
// Parse text with citation markers
const text = "Stanford values [self-directed exploration]{{cite_1}}";
const parsed = citationProcessor.parseTextWithCitations(text, citations);

// Validate all citations resolve
const validation = citationProcessor.validateCitations(text, citations);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
```

### Format for UI

```typescript
// Convert to UI-ready format
const uiReady = formatTextWithCitations(text, citations, 'Stanford');

// Send to frontend
response.json({
  suggestion: {
    text_ui_ready: uiReady  // Contains spans with citations
  }
});
```

---

## 🎨 Frontend Usage (React)

### Basic Component

```tsx
import { UIReadyText, UIReadyCitation } from '@/types/citationTypes';

function CitedText({ uiText }: { uiText: UIReadyText }) {
  return (
    <div>
      {uiText.spans.map((span, idx) => {
        if (span.citation) {
          // This span has a citation - render with tooltip
          return (
            <Tooltip key={idx} content={<CitationTooltip citation={span.citation} />}>
              <Highlight color={span.citation.styling.color_hint}>
                {span.text}
              </Highlight>
            </Tooltip>
          );
        }
        // Regular text - no citation
        return <span key={idx}>{span.text}</span>;
      })}
    </div>
  );
}
```

### Tooltip Component

```tsx
function CitationTooltip({ citation }: { citation: UIReadyCitation }) {
  const { tooltip, styling } = citation;

  return (
    <div className={`citation-tooltip citation-${styling.type}`}>
      <div className="tooltip-header">
        <span className="icon">{styling.icon_hint}</span>
        <h3>{tooltip.title}</h3>
      </div>
      <h4>{tooltip.subtitle}</h4>
      <div className="content">{tooltip.content}</div>
      <div className="relevance">
        <strong>Why this matters:</strong> {tooltip.relevance}
      </div>
      {tooltip.footer && <footer>{tooltip.footer}</footer>}
    </div>
  );
}
```

---

## 🎭 5 Citation Types

### 1. Quote (Dean/AO)
- **Icon**: 🎓 Blue
- **Shows**: Dean name, publication, quote, context
- **Example**: "Dean Richard Shaw says..."

### 2. Red Flag (Problem)
- **Icon**: 🚨/⚠️ Red
- **Shows**: Flag name, severity, score impact
- **Example**: "Classroom-Bounded Learning (Major)"

### 3. Green Flag (Strength)
- **Icon**: 🌟/✅ Green
- **Shows**: Flag name, strength, score impact
- **Example**: "Self-Directed Project Extension (Exceptional)"

### 4. Value (Core Value)
- **Icon**: 💎 Purple
- **Shows**: Value name, weight, definition
- **Example**: "Intellectual Vitality (40% weight)"

### 5. Example (Elite Essay)
- **Icon**: 🌟 Amber
- **Shows**: Example ID, score, technique
- **Example**: "STAN_IV_007 (Score: 92/100)"

---

## 🧪 Testing

Run all 26 tests:
```bash
npx tsx tests/test-citation-exposure.ts
```

Expected output:
```
✅ All tests passed! (26/26)
```

---

## 📁 Files Created

```
src/services/commonAppWorkshop/
├── types/citationTypes.ts          (500 lines)
├── services/citationProcessor.ts   (700 lines)
└── utils/citationFormatter.ts      (500 lines)

tests/
└── test-citation-exposure.ts       (650 lines)

docs/
├── CITATION_EXPOSURE_PLAN.md
├── CITATION_SYSTEM_SUMMARY.md
├── CITATION_FLOW_DIAGRAM.md
└── CITATION_SYSTEM_IMPLEMENTATION_COMPLETE.md
```

---

## 🔄 Integration Steps

### Step 1: Update Batch Generation Prompt

Add citation instructions to Claude prompt:
```typescript
const PROMPT = `
When writing suggestions, cite sources inline:
[cited text]{{cite_N}}

Example: "Stanford values [self-directed exploration]{{cite_1}}"

Provide citations object with full details.
`;
```

### Step 2: Validate Citations

After Claude responds:
```typescript
const validation = citationProcessor.validateCitations(
  suggestion.text_with_citations,
  suggestion.citations
);

if (!validation.valid) {
  // Handle errors
}
```

### Step 3: Format for Frontend

```typescript
const uiReady = formatTextWithCitations(
  suggestion.text_with_citations,
  suggestion.citations,
  college_name
);

return { ...suggestion, text_ui_ready: uiReady };
```

### Step 4: Render in React

```tsx
<CitedText uiText={suggestion.text_ui_ready} />
```

---

## 💡 Benefits

✅ **Transparency**: Students see exact evidence for every claim
✅ **Trust**: All advice backed by authoritative sources
✅ **Quality**: Forces Claude to ground teaching in research
✅ **Debugging**: Easy to trace advice back to source
✅ **Learning**: Students understand college values through quotes

---

## 📊 Status

✅ **Implementation**: Complete (2,350 lines)
✅ **Testing**: 100% pass rate (26/26 tests)
✅ **Documentation**: 4 comprehensive docs
✅ **Ready**: Production-ready, awaiting integration

---

## 🆘 Need Help?

1. **Technical docs**: See [CITATION_EXPOSURE_PLAN.md](CITATION_EXPOSURE_PLAN.md)
2. **Visual examples**: See [CITATION_FLOW_DIAGRAM.md](CITATION_FLOW_DIAGRAM.md)
3. **Implementation details**: See [CITATION_SYSTEM_IMPLEMENTATION_COMPLETE.md](CITATION_SYSTEM_IMPLEMENTATION_COMPLETE.md)

---

**Next step**: Integrate citations into batch generation service prompts! 🚀
