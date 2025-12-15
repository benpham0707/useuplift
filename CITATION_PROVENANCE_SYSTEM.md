# 🔗 Citation & Provenance System
## Intelligent Source Attribution for Common App Workshop

**Core Problem**: Students (and parents) ask: "How do you KNOW Stanford values intellectual vitality at 40%? Why should I trust this?"

**Our Solution**: Every insight, weight, preference, and suggestion is traceable to a specific research source with transparent methodology.

---

## 🎯 What Needs Citation?

### Category 1: **College Values & Weights** (CRITICAL - Need Strong Citations)
**Examples**:
- "Stanford weighs Intellectual Vitality at 40%"
- "Harvard prioritizes Community Contribution at 30%"
- "MIT values Hands-On Creativity at 35%"

**Why Critical**: These are quantified claims that directly affect essay strategy. Parents will question: "Who decided these percentages?"

**Citation Requirements**:
- **Primary Sources**: Admission website statements, dean interviews, mission statements
- **Methodology**: How we derived the weights (content analysis, frequency analysis, explicit statements)
- **Confidence Level**: High (direct statement) vs Medium (inferred from multiple sources) vs Low (estimated)

**Example Citation Structure**:
```typescript
{
  value: {
    id: 'stanford_intellectual_vitality',
    name: 'Intellectual Vitality',
    weight: 40,
    confidence: 'high',

    sources: [
      {
        type: 'primary',
        source: 'Stanford Admission - What We Look For',
        url: 'https://admission.stanford.edu/apply/selection/',
        quote: 'We look for students who have demonstrated intellectual vitality',
        relevance: 'Direct statement emphasizing importance',
        date: '2024-12-01'
      },
      {
        type: 'interview',
        source: 'Dean Richard Shaw Interview - NY Times',
        url: 'https://...',
        quote: 'Intellectual vitality is our top priority... we care most about students who learn for the love of it',
        relevance: 'Explicit ranking as "top priority"',
        date: '2023-05-15'
      },
      {
        type: 'methodology',
        source: 'Internal Research - Frequency Analysis',
        explanation: 'Analyzed 50+ Stanford admission blog posts and dean interviews. "Intellectual vitality" mentioned 3x more frequently than other values.',
        confidence_contribution: 'Supports 40% weighting'
      }
    ],

    derivation_method: 'explicit_ranking', // vs 'frequency_analysis' vs 'inferred'
    last_verified: '2024-12-01'
  }
}
```

---

### Category 2: **Essay Type Requirements** (HIGH - Need Clear Citations)
**Examples**:
- "Why Us essays must include specific programs/resources"
- "Intellectual Curiosity essays need evidence of self-directed learning"
- "Community essays should show sustained commitment"

**Why Important**: Students need to know these aren't arbitrary rules, but patterns from successful essays.

**Citation Requirements**:
- **Elite Essay Database**: Patterns from 90+ scoring essays
- **Admission Guidelines**: Official essay tips from colleges
- **Common Pitfalls**: Analysis of rejected/weak essays (where available)

**Example Citation Structure**:
```typescript
{
  essayType: 'why_us',

  requirements: [
    {
      id: 'specific_programs',
      requirement: 'Name specific programs, professors, or resources',
      priority: 'critical',

      sources: [
        {
          type: 'elite_essay_pattern',
          source: 'Elite Essay Database Analysis (2020-2024)',
          finding: '94% of 90+ scoring "Why Us" essays named at least 2 specific programs or professors',
          sample_size: 127,
          confidence: 'high'
        },
        {
          type: 'admission_guideline',
          source: 'Stanford Essay Tips',
          url: 'https://admission.stanford.edu/apply/first-year/essays.html',
          quote: 'Be specific. Tell us why Stanford is a good fit for you.',
          date: '2024-09-01'
        }
      ],

      counter_evidence: null, // No contradicting evidence
      confidence: 'very_high'
    },

    {
      id: 'mutual_fit',
      requirement: 'Show what YOU bring to the college (not just what you\'ll get)',
      priority: 'important',

      sources: [
        {
          type: 'elite_essay_pattern',
          source: 'Elite Essay Database Analysis',
          finding: '78% of 90+ essays discussed mutual benefit',
          sample_size: 127,
          confidence: 'high'
        },
        {
          type: 'admission_philosophy',
          source: 'Holistic Review Principles',
          explanation: 'Colleges seek students who will contribute to campus community',
          confidence: 'medium'
        }
      ],

      confidence: 'high'
    }
  ]
}
```

---

### Category 3: **College Preferences** (MEDIUM - Need Supporting Evidence)
**Examples**:
- "Stanford loves self-directed learning experiences"
- "Harvard prefers collaborative framing over individualistic"
- "MIT wants to see you making/building things"

**Why Important**: These guide tone and content choices. Students need to understand WHY.

**Citation Requirements**:
- **Admission Website**: Explicit statements about values
- **Dean Quotes**: Interviews and blog posts
- **Pattern Analysis**: What successful admits emphasize

**Example Citation Structure**:
```typescript
{
  collegeId: 'stanford',

  preferences: {
    loves: [
      {
        preference: 'Self-directed learning experiences',

        evidence: [
          {
            type: 'dean_quote',
            source: 'Richard Shaw - Stanford Daily Interview',
            quote: 'We want students who pursue learning outside of class because they can\'t help it',
            url: '...',
            date: '2022-11-10',
            strength: 'strong'
          },
          {
            type: 'mission_statement',
            source: 'Stanford Mission',
            relevance: 'Emphasizes "independent thought" and "creativity"',
            url: '...',
            strength: 'moderate'
          },
          {
            type: 'successful_essay_pattern',
            source: 'Elite Essay Analysis',
            finding: '89% of accepted Stanford essays mentioned independent projects',
            sample_size: 94,
            strength: 'strong'
          }
        ],

        confidence: 'very_high',
        priority: 'critical'
      }
    ],

    avoids: [
      {
        red_flag: 'Prestige-focused reasons',

        evidence: [
          {
            type: 'admission_guidance',
            source: 'Stanford Essay Tips',
            quote: 'Avoid mentioning rankings or prestige',
            url: '...',
            strength: 'strong'
          },
          {
            type: 'common_mistake_analysis',
            source: 'Internal Research',
            explanation: 'Generic prestige statements appear in weak essays 3x more than strong essays',
            strength: 'moderate'
          }
        ],

        confidence: 'high',
        severity: 'high'
      }
    ]
  }
}
```

---

### Category 4: **Workshop Suggestions** (CRITICAL - Need Transparent Reasoning)
**Examples**:
- "Add more evidence of intellectual vitality to gain 13 points"
- "This phrase is too generic for Stanford"
- "Consider emphasizing community contribution for Harvard"

**Why Critical**: These are actionable recommendations. Students need to understand WHY and trust the guidance.

**Citation Requirements**:
- **Logic Chain**: How we detected the issue
- **College Context**: Why it matters for THIS college
- **Evidence**: What strong essays do differently

**Example Citation Structure**:
```typescript
{
  suggestion: {
    id: 'add_intellectual_vitality_evidence',
    type: 'gap_identified',
    priority: 'high',

    detection: {
      method: 'value_alignment_analysis',
      current_score: 72,
      target_score: 85,
      gap: -13,

      what_we_found: [
        'Student mentions "self-taught bioinformatics" ✓',
        'Student mentions "independent research" ✓',
        'No mention of WHY it excites them ✗',
        'No specific curiosity spark moment ✗'
      ],

      logic: 'Intellectual Vitality requires showing PASSION for learning, not just DOING learning. Missing emotional/curiosity component.'
    },

    why_it_matters: {
      college_context: {
        college: 'Stanford',
        value: 'Intellectual Vitality',
        weight: 40,
        priority: 'highest',

        source: {
          type: 'dean_quote',
          quote: 'We want to see the spark - what makes you come alive intellectually',
          source: 'Dean Shaw Interview',
          url: '...'
        }
      },

      impact: 'This is Stanford\'s TOP priority (40%). A 13-point gap here significantly affects overall alignment.',

      estimated_improvement: {
        if_addressed: '+10 to +15 points in Intellectual Vitality',
        overall_impact: 'Could improve total alignment from 72 to 80+',
        confidence: 'high'
      }
    },

    how_to_fix: {
      teaching: 'Intellectual vitality isn\'t about DOING work - it\'s about LOVING learning. Show the moment your curiosity sparked.',

      elite_pattern: {
        pattern: 'Describe the specific moment/question that hooked you',
        source: 'Elite Essay Analysis',
        evidence: '87% of 90+ Stanford essays include a "curiosity spark moment"',
        sample_size: 94
      },

      specific_suggestions: [
        {
          suggestion: 'Add 1-2 sentences about WHAT sparked your curiosity about CRISPR',
          example: '"After reading about CRISPR, I couldn\'t stop wondering: could we use it to cure genetic diseases in my community?"',
          why: 'Shows curiosity-driven motivation (not just academic interest)',
          estimated_gain: '+8 points'
        },
        {
          suggestion: 'Describe the emotional/intellectual pull',
          example: '"I became obsessed. I had to know how it worked."',
          why: 'Shows passion (Stanford\'s key indicator of intellectual vitality)',
          estimated_gain: '+5 points'
        }
      ]
    },

    citations: [
      {
        claim: 'Intellectual Vitality is Stanford\'s top priority (40%)',
        source: 'Stanford Value Weighting Research',
        url: '/research/stanford-values'
      },
      {
        claim: '87% of 90+ essays include curiosity spark moment',
        source: 'Elite Essay Database Analysis',
        methodology: 'Content analysis of 94 successful Stanford essays (2020-2024)'
      }
    ]
  }
}
```

---

### Category 5: **Elite Essay Patterns** (MEDIUM - Need Data Backing)
**Examples**:
- "90+ scoring 'Why Us' essays name specific professors"
- "Strong intellectual essays show cross-disciplinary connections"
- "Successful community essays quantify impact"

**Why Important**: These are aspirational patterns. Need data to prove they're real.

**Citation Requirements**:
- **Sample Size**: How many essays analyzed
- **Percentage**: What % of top essays use this pattern
- **Methodology**: How patterns were identified

**Example Citation Structure**:
```typescript
{
  pattern: {
    id: 'specific_professor_mention',
    type: 'elite_essay_pattern',
    essay_type: 'why_us',

    finding: 'Mentioning specific professors and their research significantly correlates with high essay scores',

    data: {
      sample_size: 127,
      date_range: '2020-2024',
      colleges: ['Stanford', 'Harvard', 'MIT', 'Yale'],

      results: {
        essays_with_pattern: 94,
        percentage: 74,
        average_score: 92,

        control_group: {
          essays_without_pattern: 33,
          percentage: 26,
          average_score: 76
        },

        score_differential: 16,
        statistical_significance: 'p < 0.01'
      },

      methodology: {
        description: 'Content analysis of admitted student essays',
        scoring_method: 'Independent review by 3 admission officers (blind)',
        pattern_detection: 'Named entities extraction + manual verification'
      }
    },

    interpretation: {
      what_it_means: 'Students who research specific faculty and connect to their work demonstrate genuine fit',
      why_it_works: 'Shows research depth + authentic interest + strategic thinking',
      confidence: 'very_high'
    },

    limitations: [
      'Sample limited to essays from admitted students (no rejection data)',
      'Correlation does not prove causation',
      'May vary by college and department'
    ]
  }
}
```

---

## 🏗️ System Architecture

### 1. **Research Database** (Source of Truth)

```typescript
// Central research database
interface ResearchDatabase {
  colleges: CollegeResearch[];
  essayTypes: EssayTypeResearch[];
  elitePatterns: ElitePatternResearch[];
  methodology: ResearchMethodology;
}

interface CollegeResearch {
  id: string;
  name: string;

  // Core values with full provenance
  values: ValueResearch[];

  // Preferences with evidence
  preferences: PreferenceResearch[];

  // Metadata
  research_quality: {
    depth: number; // 1-10
    last_updated: Date;
    review_cycle: 'quarterly' | 'bi-annual' | 'annual';
    next_review: Date;
  };

  // All sources used for this college
  sources: Source[];
}

interface ValueResearch {
  id: string;
  name: string;
  weight: number;

  // Provenance
  derivation: {
    method: 'explicit_ranking' | 'frequency_analysis' | 'inferred' | 'composite';
    confidence: 'very_high' | 'high' | 'medium' | 'low';
    primary_sources: Source[];
    supporting_sources: Source[];
    counter_evidence?: Source[];
    last_verified: Date;
  };

  // Definition and guidance
  definition: string;
  how_to_demonstrate: string[];

  // Detection logic
  detection_criteria: {
    keywords: string[];
    patterns: string[];
    semantic_indicators: string[];
  };
}

interface Source {
  id: string;
  type: 'admission_website' | 'dean_interview' | 'mission_statement' |
        'essay_database' | 'internal_analysis' | 'third_party_research';

  title: string;
  url?: string;
  date: Date;
  author?: string;
  publisher?: string;

  // Content
  quote?: string;
  summary?: string;
  relevance: string;

  // Metadata
  credibility: 'primary' | 'secondary' | 'tertiary';
  strength: 'strong' | 'moderate' | 'weak';

  // Archival
  archived_copy?: string; // Local copy in case URL dies
  last_verified: Date;
}
```

---

### 2. **Citation Service** (Runtime Attribution)

```typescript
// Service that attaches citations to every piece of guidance
class CitationService {

  /**
   * When we detect a value gap and suggest improvement,
   * attach full citation chain
   */
  async generateSuggestionWithCitation(params: {
    college_id: string;
    value_id: string;
    current_score: number;
    gap: number;
    draft_text: string;
  }): Promise<SuggestionWithCitation> {

    // 1. Get value research from database
    const valueResearch = await this.getValueResearch(
      params.college_id,
      params.value_id
    );

    // 2. Detect what's missing
    const missingElements = await this.detectMissingElements(
      params.draft_text,
      valueResearch.detection_criteria
    );

    // 3. Get elite patterns for this value
    const elitePatterns = await this.getElitePatterns(
      params.college_id,
      params.value_id
    );

    // 4. Generate suggestion with full citation chain
    return {
      suggestion: {
        id: generateId(),
        type: 'value_gap',
        priority: this.calculatePriority(params.gap, valueResearch.weight),

        detection: {
          method: 'value_alignment_analysis',
          current_score: params.current_score,
          target_score: 85,
          gap: params.gap,
          what_missing: missingElements,

          // CITATION: How we know this is missing
          detection_logic: {
            criteria: valueResearch.detection_criteria,
            source: {
              type: 'internal_methodology',
              description: 'Semantic analysis of draft against value indicators',
              confidence: 'high'
            }
          }
        },

        why_it_matters: {
          college_context: {
            college: params.college_id,
            value: valueResearch.name,
            weight: valueResearch.weight,

            // CITATION: Why this value matters to THIS college
            citations: valueResearch.derivation.primary_sources.map(s => ({
              claim: `${valueResearch.name} is weighted at ${valueResearch.weight}%`,
              source: s.title,
              quote: s.quote,
              url: s.url,
              date: s.date,
              credibility: s.credibility
            }))
          },

          impact: `This is ${this.getPriorityLabel(valueResearch.weight)}. A ${params.gap}-point gap significantly affects overall alignment.`,

          estimated_improvement: {
            if_addressed: `+${Math.round(params.gap * 0.7)} to +${params.gap} points`,
            confidence: 'high'
          }
        },

        how_to_fix: {
          teaching: this.generateTeaching(valueResearch),

          elite_patterns: elitePatterns.map(pattern => ({
            pattern: pattern.description,
            example: pattern.example,

            // CITATION: Elite pattern data
            citation: {
              finding: pattern.data.finding,
              sample_size: pattern.data.sample_size,
              percentage: pattern.data.percentage,
              source: 'Elite Essay Database Analysis',
              methodology: pattern.data.methodology.description,
              confidence: pattern.interpretation.confidence
            }
          })),

          specific_suggestions: this.generateSpecificSuggestions(
            missingElements,
            valueResearch,
            elitePatterns
          )
        }
      },

      // Full citation index for transparency
      citation_index: this.buildCitationIndex([
        ...valueResearch.derivation.primary_sources,
        ...valueResearch.derivation.supporting_sources,
        ...elitePatterns.flatMap(p => p.sources)
      ])
    };
  }

  /**
   * When showing college values, include full provenance
   */
  async getCollegeValuesWithProvenance(college_id: string) {
    const research = await this.getCollegeResearch(college_id);

    return research.values.map(value => ({
      ...value,

      // Provenance panel (expandable in UI)
      provenance: {
        how_we_know: {
          method: value.derivation.method,
          confidence: value.derivation.confidence,
          last_verified: value.derivation.last_verified,

          explanation: this.explainDerivationMethod(value.derivation.method)
        },

        primary_evidence: value.derivation.primary_sources.map(source => ({
          type: source.type,
          title: source.title,
          url: source.url,
          quote: source.quote,
          date: source.date,
          relevance: source.relevance,
          strength: source.strength
        })),

        supporting_evidence: value.derivation.supporting_sources.map(source => ({
          type: source.type,
          title: source.title,
          summary: source.summary,
          strength: source.strength
        })),

        methodology: value.derivation.method === 'frequency_analysis'
          ? this.getFrequencyAnalysisDetails(college_id, value.id)
          : null,

        transparency_notes: [
          `This value weight was last verified on ${value.derivation.last_verified}`,
          `Confidence level: ${value.derivation.confidence}`,
          value.derivation.counter_evidence
            ? 'Some contradicting evidence exists - see full research'
            : 'No contradicting evidence found'
        ]
      }
    }));
  }

  /**
   * Build citation index for a suggestion
   */
  private buildCitationIndex(sources: Source[]): CitationIndex {
    return {
      total_sources: sources.length,

      by_type: {
        primary: sources.filter(s => s.credibility === 'primary').length,
        secondary: sources.filter(s => s.credibility === 'secondary').length,
        tertiary: sources.filter(s => s.credibility === 'tertiary').length
      },

      by_strength: {
        strong: sources.filter(s => s.strength === 'strong').length,
        moderate: sources.filter(s => s.strength === 'moderate').length,
        weak: sources.filter(s => s.strength === 'weak').length
      },

      all_sources: sources.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        url: s.url,
        date: s.date,
        credibility: s.credibility,
        strength: s.strength,
        quote: s.quote,
        summary: s.summary
      }))
    };
  }
}
```

---

### 3. **Detection Engine** (What Triggers Citations)

```typescript
// Detect when to show citations based on user actions
class CitationTriggerEngine {

  /**
   * Determine when citations should be surfaced
   */
  detectCitationMoments(context: {
    user_action: string;
    page: string;
    element: string;
    data: any;
  }): CitationMoment[] {

    const moments: CitationMoment[] = [];

    // MOMENT 1: User views college values
    if (context.page === 'college_view' && context.element === 'core_values') {
      moments.push({
        type: 'value_weight_claim',
        trigger: 'hover_on_weight',
        citation_type: 'provenance_panel',
        priority: 'high',

        what_to_show: {
          claim: `${context.data.value_name} is weighted at ${context.data.weight}%`,
          sources: 'primary_sources',
          methodology: true,
          confidence: true
        }
      });
    }

    // MOMENT 2: User receives suggestion
    if (context.user_action === 'receives_suggestion') {
      moments.push({
        type: 'suggestion_rationale',
        trigger: 'suggestion_appears',
        citation_type: 'inline_reasoning',
        priority: 'critical',

        what_to_show: {
          detection_logic: true,
          college_context: true,
          elite_patterns: true,
          estimated_impact: true,

          expandable: {
            full_citation_chain: true,
            methodology: true,
            sample_data: true
          }
        }
      });
    }

    // MOMENT 3: User sees "red flag" warning
    if (context.element === 'pitfall_detected') {
      moments.push({
        type: 'negative_pattern_warning',
        trigger: 'warning_appears',
        citation_type: 'evidence_based_warning',
        priority: 'high',

        what_to_show: {
          what_pattern: context.data.pattern,
          why_problematic: true,
          college_specific_evidence: true,
          how_common_in_weak_essays: true,

          citations: {
            admission_guidance: true,
            pattern_analysis: true
          }
        }
      });
    }

    // MOMENT 4: User compares colleges
    if (context.page === 'comparison_modal') {
      moments.push({
        type: 'college_difference_claim',
        trigger: 'comparison_shown',
        citation_type: 'side_by_side_sources',
        priority: 'medium',

        what_to_show: {
          value_differences: true,
          source_for_each_college: true,
          methodology: false, // Too detailed for comparison

          footer_note: 'View detailed research for each college'
        }
      });
    }

    // MOMENT 5: User questions alignment score
    if (context.element === 'alignment_score' && context.user_action === 'click') {
      moments.push({
        type: 'score_calculation_transparency',
        trigger: 'click_on_score',
        citation_type: 'methodology_explanation',
        priority: 'medium',

        what_to_show: {
          how_calculated: true,
          what_factors: true,
          weight_distribution: true,
          confidence_level: true,

          example: 'Show calculation breakdown'
        }
      });
    }

    return moments;
  }
}
```

---

### 4. **UI Citation Components** (How Citations Appear)

```typescript
// Different ways to show citations in UI

// TYPE 1: Inline Citation (for specific claims)
<InlineCitation
  claim="Stanford weighs Intellectual Vitality at 40%"
  sources={[
    {
      type: 'dean_interview',
      title: 'Dean Shaw - NY Times Interview',
      quote: 'Intellectual vitality is our top priority',
      url: '...',
      date: '2023-05-15'
    }
  ]}
  confidence="very_high"
  lastVerified="2024-12-01"
/>

// Renders as:
// Stanford weighs Intellectual Vitality at 40% [i]
// Hover shows: "Source: Dean Shaw Interview (2023) - 'Intellectual vitality is our top priority'"


// TYPE 2: Provenance Panel (for value weights)
<ProvenancePanel
  value="Intellectual Vitality"
  weight={40}
  derivation={{
    method: 'explicit_ranking',
    confidence: 'very_high',
    primary_sources: [...],
    methodology: '...'
  }}
/>

// Renders as expandable panel:
// [?] How do we know this weight?
//   → Primary Sources (3)
//   → Methodology: Explicit ranking by Dean
//   → Confidence: Very High
//   → Last Verified: Dec 1, 2024


// TYPE 3: Suggestion Citation Chain (for workshop suggestions)
<SuggestionWithCitations
  suggestion={{
    text: 'Add more intellectual vitality evidence to gain 13 points',

    citations: {
      why_detected: {
        method: 'Semantic analysis',
        confidence: 'high'
      },

      why_matters: {
        college_weight: 40,
        source: 'Dean Shaw Interview',
        quote: '...'
      },

      how_to_fix: {
        elite_pattern: {
          finding: '87% of 90+ essays include curiosity spark',
          sample: 94,
          source: 'Elite Essay Database'
        }
      }
    }
  }}
/>


// TYPE 4: Research Depth Indicator (trust signal)
<ResearchDepthIndicator
  college="Stanford"
  depth={9}
  sources={{
    admission_website: 1,
    dean_interviews: 3,
    mission_statement: 1,
    elite_essay_database: 1
  }}
  lastUpdated="2024-12-01"
/>

// Renders as:
// Research Depth: ★★★★★★★★★☆ (9/10)
// Based on 6 sources • Last updated Dec 1, 2024
```

---

## 🎯 Dynamic Citation Logic

### Smart Citation Triggers

```typescript
// When to show citations automatically vs. on-demand

const CITATION_DISPLAY_RULES = {

  // ALWAYS show (high-stakes claims)
  always: [
    'value_weight_percentage',
    'negative_pattern_warning',
    'critical_suggestion',
    'college_comparison_claim'
  ],

  // Show on HOVER (supporting context)
  on_hover: [
    'preference_statement',
    'elite_pattern_mention',
    'score_calculation'
  ],

  // Show on CLICK/EXPAND (deep dive)
  on_demand: [
    'full_methodology',
    'research_database_details',
    'sample_essay_excerpts',
    'statistical_analysis'
  ],

  // Show in FOOTER (aggregate transparency)
  in_footer: [
    'all_sources_used_on_page',
    'research_quality_indicator',
    'last_updated_date'
  ]
};
```

---

### Confidence-Based Display

```typescript
// Adjust citation prominence based on confidence

function getCitationDisplayStyle(confidence: ConfidenceLevel): CitationStyle {
  switch (confidence) {
    case 'very_high':
      // Subtle citation - high trust
      return {
        indicator: 'small_superscript',
        hover: 'brief_source_info',
        emphasis: 'minimal'
      };

    case 'high':
      // Standard citation
      return {
        indicator: 'inline_icon',
        hover: 'source_quote',
        emphasis: 'standard'
      };

    case 'medium':
      // More prominent - flag uncertainty
      return {
        indicator: 'inline_icon_with_asterisk',
        hover: 'source_quote_plus_methodology',
        emphasis: 'moderate',
        disclaimer: 'This is our best estimate based on available data'
      };

    case 'low':
      // Very prominent - transparent about uncertainty
      return {
        indicator: 'warning_icon',
        hover: 'full_explanation_of_uncertainty',
        emphasis: 'high',
        disclaimer: 'Limited data available. Use as general guidance.',
        show_alternative_sources: true
      };
  }
}
```

---

## ✅ Implementation Priorities

### Phase 1: Core Citation System (Week 1-2)
- ✅ Build research database schema
- ✅ Import Stanford, Harvard, MIT research with full citations
- ✅ Create CitationService
- ✅ Implement basic inline citations

### Phase 2: Suggestion Citations (Week 3)
- ✅ Attach citations to all workshop suggestions
- ✅ Show detection logic transparently
- ✅ Link to college-specific research

### Phase 3: Elite Pattern Citations (Week 4)
- ✅ Import elite essay database findings
- ✅ Cite sample sizes and methodologies
- ✅ Show statistical significance

### Phase 4: UI Polish (Week 5)
- ✅ Provenance panels
- ✅ Research depth indicators
- ✅ Citation hover states
- ✅ Methodology explanations

---

This system ensures **every claim is traceable, every suggestion is justified, and every recommendation is backed by research**. Students (and parents) can trust the system because they can SEE the sources. 🔗
