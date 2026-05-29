# Portfolio Scanner Implementation Plan

## Overview

This document describes the implementation of the UC-focused holistic portfolio scanner system. The system analyzes complete student portfolios and provides detailed feedback, scores, and recommendations calibrated to UC admissions standards.

## Architecture

### 4-Stage Pipeline (9 LLM Calls)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PORTFOLIO SCANNER PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: HOLISTIC UNDERSTANDING (1 LLM call)                   │
│  ┌─────────────────────────────────────────────┐                │
│  │ • First-pass comprehensive assessment       │                │
│  │ • Central narrative thread identification   │                │
│  │ • UC competitiveness preview               │                │
│  │ • Context factors (first-gen, low-income)  │                │
│  │ • Red flags and hidden strengths           │                │
│  └─────────────────────────────────────────────┘                │
│                          ↓                                       │
│  Stage 2: DIMENSION DEEP DIVE (6 parallel LLM calls)            │
│  ┌─────────────────────────────────────────────┐                │
│  │ Academic Excellence ────┐                   │                │
│  │ Intellectual Curiosity ─┼─→ Run in         │                │
│  │ Leadership & Initiative ┼   parallel       │                │
│  │ Community Impact ───────┤                   │                │
│  │ Authenticity & Voice ───┤                   │                │
│  │ Future Readiness ───────┘                   │                │
│  └─────────────────────────────────────────────┘                │
│                          ↓                                       │
│  Stage 3: SYNTHESIS (1 LLM call)                                │
│  ┌─────────────────────────────────────────────┐                │
│  │ • Calculate weighted overall score          │                │
│  │ • Determine profile archetype               │                │
│  │ • Identify dimensional interactions         │                │
│  │ • UC campus alignment assessment            │                │
│  │ • Admissions officer perspective            │                │
│  └─────────────────────────────────────────────┘                │
│                          ↓                                       │
│  Stage 4: STRATEGIC GUIDANCE (1 LLM call)                       │
│  ┌─────────────────────────────────────────────┐                │
│  │ • Prioritized recommendations               │                │
│  │ • Grade-by-grade roadmap                    │                │
│  │ • Timeline-based action items               │                │
│  │ • Critical warnings                         │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## UC Evaluation Modes

Three evaluation modes with different dimension weights:

### UC Berkeley Mode
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Academic Excellence | 35% | Strong foundation required |
| Intellectual Curiosity | 25% | Critical differentiator - research university |
| Authenticity & Voice | 20% | PIQs matter significantly |
| Leadership & Initiative | 15% | Valued but not primary |
| Community Impact | 3% | Positive but not differentiating |
| Future Readiness | 2% | Minimal weight |

### UCLA Mode
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Authenticity & Voice | 30% | PIQs are king at UCLA |
| Academic Excellence | 30% | Co-equal with voice |
| Community Impact | 20% | "Bruin values" emphasis |
| Leadership & Initiative | 15% | Valued equally |
| Intellectual Curiosity | 3% | Lower emphasis than Berkeley |
| Future Readiness | 2% | Minimal weight |

### General UC Mode
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Academic Excellence | 40% | Primary factor |
| Authenticity & Voice | 20% | PIQs differentiate |
| Leadership & Initiative | 15% | Standard weight |
| Community Impact | 10% | Public university mission |
| Intellectual Curiosity | 10% | Moderate importance |
| Future Readiness | 5% | Slightly more relevant |

## File Structure

```
src/services/portfolio/
├── index.ts                          # Main exports
├── portfolioScannerService.ts        # Main orchestrator
├── types/
│   └── index.ts                      # TypeScript interfaces
├── constants/
│   └── ucCalibration.ts              # UC-specific benchmarks and tiers
├── stage1_holistic/
│   ├── index.ts
│   └── holisticPortfolioAnalyzer.ts  # Stage 1 implementation
├── stage2_dimensions/
│   ├── index.ts
│   ├── academicExcellenceAnalyzer.ts
│   ├── leadershipAnalyzer.ts
│   ├── intellectualCuriosityAnalyzer.ts
│   ├── communityImpactAnalyzer.ts
│   ├── authenticityVoiceAnalyzer.ts
│   └── futureReadinessAnalyzer.ts
├── stage3_synthesis/
│   ├── index.ts
│   └── synthesisEngine.ts            # Stage 3 implementation
└── stage4_guidance/
    ├── index.ts
    └── strategicGuidanceEngine.ts    # Stage 4 implementation

tests/
└── test-portfolio-scanner.ts         # Comprehensive tests
```

## Key Features

### 1. Data-Driven Calibration
All scoring is calibrated to real UC admissions data:
- **UC Berkeley**: 4.15-4.29 weighted GPA (middle 50%), 11.3% acceptance
- **UCLA**: 4.20-4.34 weighted GPA (middle 50%), 9% acceptance
- **NACAC data**: 76.8% rate GPA as #1 factor

### 2. Tier-Based Scoring (4 Tiers)
Each dimension uses a 4-tier system:
- **Exceptional** (9.0-10.0): Top 1-5%
- **Strong** (7.0-8.9): Top 10-20%
- **Developing** (4.0-6.9): Top 30-50%
- **Foundational** (1.0-3.9): Below 50%

### 3. Context Adjustments
System accounts for UC's public mission:
- First-generation students: Academic boost
- Low-income students: Work = valuable EC
- Under-resourced schools: Limited AP offerings considered
- Family responsibilities: Counts as leadership

### 4. Profile Archetypes
Students are classified into archetypes:
- **Scholar**: High academics + intellectual curiosity (Berkeley fit)
- **Leader**: High leadership + community (UCLA fit)
- **Well-Rounded**: Balanced across dimensions
- **Specialist**: Exceptional in 1-2 dimensions
- **Emerging**: Still developing

### 5. Heuristic Fallback
Each analyzer has a heuristic fallback if LLM calls fail:
- Rule-based scoring using portfolio data
- Lower confidence but maintains functionality
- 3-tier fallback: Primary → Retry → Heuristic

## Usage

```typescript
import { analyzePortfolio } from '@/services/portfolio';

// Full comprehensive analysis
const result = await analyzePortfolio(portfolioData, {
  uc_mode: 'berkeley',
  depth: 'comprehensive',
  include_synthesis: true,
  include_guidance: true,
});

// Quick analysis (no guidance)
const quickResult = await analyzePortfolioQuick(portfolioData, 'ucla');
```

## Output Structure

```typescript
interface PortfolioAnalysisResult {
  // Metadata
  analysis_id: string;
  uc_evaluation_mode: 'berkeley' | 'ucla' | 'general_uc';

  // Stage 1: Holistic Understanding
  holistic: HolisticPortfolioUnderstanding;

  // Stage 2: Dimension Scores
  dimensions: {
    academicExcellence: AcademicExcellenceAnalysis;
    leadershipInitiative: LeadershipInitiativeAnalysis;
    intellectualCuriosity: IntellectualCuriosityAnalysis;
    communityImpact: CommunityImpactAnalysis;
    authenticityVoice: AuthenticityVoiceAnalysis;
    futureReadiness: FutureReadinessAnalysis;
  };

  // Stage 3: Synthesis
  synthesis: {
    overallScore: number;  // 0-10
    profileArchetype: string;
    narrativeSummary: string;
    ucCampusAlignment: {...};
    admissionsOfficerPerspective: {...};
  };

  // Stage 4: Strategic Guidance
  guidance: {
    prioritizedRecommendations: [...];
    targetOutcomes: {...};
    criticalWarnings: string[];
  };

  // Performance metrics
  performance: {
    total_duration_ms: number;
    llm_calls: number;
    cost_usd: number;
  };
}
```

## Testing

Run tests with:
```bash
NODE_OPTIONS="--no-warnings" npx tsx tests/test-portfolio-scanner.ts
```

Tests include:
1. **Berkeley Candidate**: High-achieving student with research
2. **UCLA Candidate**: Community-focused with strong PIQs
3. **First-Gen Low-Income**: Context-heavy evaluation
4. **Weight Differences**: Same profile across different modes

## Cost Estimation

Per analysis (9 LLM calls):
- Input tokens: ~27,000 (3,000 × 9)
- Output tokens: ~18,000 (2,000 × 9)
- Estimated cost: $0.35-0.50 per analysis

## Next Steps

1. Integration with existing PIQ workshop system
2. Frontend UI for portfolio input
3. Batch processing capabilities
4. Analytics dashboard for trends
5. A/B testing different prompt variations
