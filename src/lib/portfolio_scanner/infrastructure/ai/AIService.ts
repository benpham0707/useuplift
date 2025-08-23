// src/infrastructure/ai/AIIntegrationService.ts

import { injectable, inject } from 'inversify';
import OpenAI from 'openai';
import { UserProfile } from '../../core/domain/entities/UserProfile';
import { Experience } from '../../core/domain/entities/Experience';
import { Achievement } from '../../core/domain/entities/Achievement';
import { AIServiceError } from '../../shared/errors/ProfileErrors';
import { Logger } from '../../shared/utils/logger';
import { ConfigService } from '../config/ConfigService';

interface PortfolioAnalysisResult {
  overallScore: number;
  rubricScores: {
    academicExcellence: RubricScore;
    leadershipPotential: RubricScore;
    personalGrowth: RubricScore;
    communityImpact: RubricScore;
    uniqueValue: RubricScore;
    futureReadiness: RubricScore;
  };
  strengths: InsightPoint[];
  growthAreas: InsightPoint[];
  hiddenGems: InsightPoint[];
  actionableSteps: ActionStep[];
  peerComparison: PeerComparisonInsight;
}

interface RubricScore {
  score: number; // 1-10
  evidence: string[];
  feedback: string;
  improvementSuggestions: string[];
}

interface InsightPoint {
  category: string;
  insight: string;
  evidence: string;
  significance: 'high' | 'medium' | 'low';
}

interface ActionStep {
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;
  rationale: string;
  expectedImpact: string;
}

interface PeerComparisonInsight {
  percentile: number;
  standoutFactors: string[];
  competitiveGaps: string[];
  uniqueAdvantages: string[];
}

interface NarrativeGuidanceResult {
  authenticityScore: number;
  storyStructure: StoryStructureAnalysis;
  emotionalResonance: EmotionalResonanceAnalysis;
  personalVoice: PersonalVoiceAnalysis;
  guidedQuestions: GuidedQuestion[];
  enhancementSuggestions: EnhancementSuggestion[];
  alternativeAngles: AlternativeAngle[];
}

interface StoryStructureAnalysis {
  hasCompellingHook: boolean;
  hasConcreteDetails: boolean;
  hasPersonalReflection: boolean;
  hasClearGrowth: boolean;
  suggestedImprovements: string[];
}

interface EmotionalResonanceAnalysis {
  emotionalDepth: number; // 1-10
  vulnerabilityPresent: boolean;
  authenticEmotions: string[];
  suggestedEmotionalElements: string[];
}

interface PersonalVoiceAnalysis {
  voiceConsistency: number; // 1-10
  uniquePhrases: string[];
  personalityTraits: string[];
  voiceStrengthening: string[];
}

interface GuidedQuestion {
  question: string;
  purpose: string;
  expectedInsight: string;
}

interface EnhancementSuggestion {
  originalText: string;
  suggestion: string;
  rationale: string;
  preservesAuthenticity: boolean;
}

interface AlternativeAngle {
  angle: string;
  whyItWorks: string;
  howToApproach: string;
  potentialImpact: string;
}

@injectable()
export class AIIntegrationService {
  private openai: OpenAI;
  private readonly model: string;

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(ConfigService) private config: ConfigService
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY')
    });
    this.model = this.config.get('AI_MODEL', 'gpt-4-turbo-preview');
  }

  // Portfolio Analysis with Comprehensive Rubric

  public async analyzePortfolio(profile: UserProfile): Promise<PortfolioAnalysisResult> {
    try {
      const prompt = this.buildPortfolioAnalysisPrompt(profile);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getPortfolioAnalysisSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.validateAndEnrichAnalysisResult(result, profile);
    } catch (error) {
      this.logger.error('Portfolio analysis failed', { error, profileId: profile.id });
      throw new AIServiceError('portfolio_analysis', 'OpenAI', error.message);
    }
  }

  // Narrative Guidance for Authentic Storytelling

  public async provideNarrativeGuidance(
    experience: Experience | Achievement,
    context: {
      purpose: 'college_essay' | 'scholarship' | 'job_application';
      theme?: string;
      currentDraft?: string;
    }
  ): Promise<NarrativeGuidanceResult> {
    try {
      const prompt = this.buildNarrativeGuidancePrompt(experience, context);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getNarrativeGuidanceSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Higher temperature for creative guidance
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.validateNarrativeGuidanceResult(result);
    } catch (error) {
      this.logger.error('Narrative guidance failed', { error });
      throw new AIServiceError('narrative_guidance', 'OpenAI', error.message);
    }
  }

  // Deep Skill Extraction with Evidence

  public async extractSkillsWithEvidence(
    experiences: Experience[],
    achievements: Achievement[]
  ): Promise<{
    skills: Map<string, SkillAnalysis>;
    hiddenStrengths: HiddenStrength[];
    crossFunctionalAbilities: string[];
  }> {
    try {
      const prompt = this.buildSkillExtractionPrompt(experiences, achievements);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSkillExtractionSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.processSkillExtractionResult(result);
    } catch (error) {
      this.logger.error('Skill extraction failed', { error });
      throw new AIServiceError('skill_extraction', 'OpenAI', error.message);
    }
  }

  // System Prompts - The Core of Our AI's Understanding

  private getPortfolioAnalysisSystemPrompt(): string {
    return `You are an expert college admissions counselor and career advisor with 20+ years of experience helping students from diverse backgrounds. Your role is to provide honest, constructive analysis that helps students understand their strengths while identifying concrete ways to improve.

CRITICAL PRINCIPLES:
1. **Equity-Focused**: Recognize that students have different opportunities based on their circumstances. Value growth, resilience, and impact relative to context.
2. **Strength-Based**: Always lead with what the student does well before discussing areas for improvement.
3. **Actionable Feedback**: Every critique must come with specific, achievable steps for improvement.
4. **Hidden Gem Detection**: Look for undervalued experiences that demonstrate exceptional qualities.
5. **Authentic Growth**: Focus on genuine development, not resume padding.

RUBRIC FOR EVALUATION (Score 1-10 for each):

1. **ACADEMIC EXCELLENCE**
   - Not just GPA, but intellectual curiosity and growth trajectory
   - Course rigor relative to what's available
   - Self-directed learning and intellectual interests
   - Evidence: Specific courses, projects, independent study

2. **LEADERSHIP POTENTIAL**
   - Both formal and informal leadership
   - Initiative-taking and problem-solving
   - Ability to inspire and collaborate
   - Evidence: Specific roles, initiatives started, people impacted

3. **PERSONAL GROWTH**
   - Self-awareness and reflection
   - Overcoming challenges and learning from failures
   - Adaptability and resilience
   - Evidence: Specific challenges faced, lessons learned, changes made

4. **COMMUNITY IMPACT**
   - Genuine service and engagement
   - Understanding of social issues
   - Sustained commitment vs. one-time activities
   - Evidence: Hours served, people helped, systems changed

5. **UNIQUE VALUE**
   - What makes this student distinctive
   - Unusual combinations of interests/skills
   - Personal background that adds perspective
   - Evidence: Specific experiences, perspectives, achievements

6. **FUTURE READINESS**
   - Clear goals and realistic plans
   - Skills aligned with aspirations
   - Evidence of preparation and research
   - Evidence: Specific steps taken, skills developed, connections made

IMPORTANT CONSIDERATIONS:
- A student working 20 hours/week to support family while maintaining a 3.5 GPA shows more strength than a student with a 4.0 and no responsibilities
- Leadership in family contexts (translating for parents, caring for siblings) is as valuable as being student body president
- Self-taught skills demonstrate exceptional initiative
- Community impact in local/family contexts is as meaningful as formal volunteering

Provide analysis in JSON format with specific evidence and actionable feedback for each rubric category.`;
  }

  private getNarrativeGuidanceSystemPrompt(): string {
    return `You are a master storytelling coach who helps students find and articulate their authentic voice. Your role is NOT to write for them, but to ask the right questions and provide guidance that helps them discover their own insights and express them powerfully.

CORE PHILOSOPHY:
1. **Authenticity Above All**: The student's genuine voice and experience must shine through
2. **Depth Over Breadth**: One meaningful story told well beats five surface-level anecdotes
3. **Show, Don't Tell**: Guide them to use concrete details and sensory language
4. **Personal Insight**: The reflection matters more than the achievement itself
5. **Emotional Truth**: Help them access and express genuine emotions

GUIDANCE FRAMEWORK:

1. **STORY STRUCTURE ANALYSIS**
   - Hook: Does it immediately engage the reader?
   - Context: Is the situation clearly established?
   - Challenge: Is there meaningful conflict or growth opportunity?
   - Action: Are their choices and actions clear?
   - Result: Is the outcome concrete?
   - Reflection: Is there deep personal insight?

2. **EMOTIONAL RESONANCE CHECK**
   - Are real emotions present (not just "I was happy/sad")?
   - Is there vulnerability that creates connection?
   - Does it feel genuine vs. what they think readers want?
   - Are there moments of specific sensory detail?

3. **PERSONAL VOICE ASSESSMENT**
   - Does it sound like a real teenager/young adult?
   - Are there unique phrases or perspectives?
   - Is the tone consistent with their personality?
   - Does it avoid clichés and generic statements?

4. **GUIDED QUESTIONING TECHNIQUE**
   Instead of saying "write about leadership," ask:
   - "Tell me about a moment when you had to make a difficult decision that affected others"
   - "What did that feel like in your body?"
   - "What were you afraid might happen?"
   - "What surprised you about how people responded?"
   - "If you could go back, what would you tell yourself in that moment?"

5. **ENHANCEMENT WITHOUT ALTERATION**
   - Identify strong moments and ask them to expand
   - Point out where more sensory detail would help
   - Suggest where personal reflection could go deeper
   - Never rewrite their words, only guide their thinking

Provide guidance in JSON format with specific questions and suggestions that maintain their authentic voice.`;
  }

  private getSkillExtractionSystemPrompt(): string {
    return `You are an expert at identifying transferable skills and hidden strengths in young people's experiences. Your analysis goes beyond obvious skills to find deeper competencies and cross-functional abilities.

SKILL IDENTIFICATION FRAMEWORK:

1. **OBVIOUS SKILLS**: The ones clearly stated or directly observable
2. **HIDDEN SKILLS**: The ones implied by actions but not recognized
3. **TRANSFERABLE SKILLS**: How skills from one domain apply elsewhere
4. **EMERGING SKILLS**: Early indicators of developing strengths
5. **CROSS-FUNCTIONAL ABILITIES**: Skills that bridge multiple areas

ANALYSIS PRINCIPLES:
- A student managing family finances shows financial literacy AND responsibility AND systems thinking
- Gaming leadership demonstrates strategic planning, resource management, and team coordination
- Caregiving develops emotional intelligence, time management, and crisis handling
- Self-taught skills indicate learning agility and intrinsic motivation

EVIDENCE REQUIREMENTS:
- Every skill must have specific behavioral evidence
- Look for patterns across experiences
- Consider context and constraints
- Value depth of skill application over breadth

SPECIAL CONSIDERATIONS:
- Cultural translation skills (bridging two worlds)
- Resourcefulness in constraint situations
- Emotional labor and interpersonal skills
- Digital native abilities often overlooked
- Family responsibility as leadership training

Provide comprehensive skill analysis with specific evidence and cross-functional applications in JSON format.`;
  }

  // Prompt Building Methods

  private buildPortfolioAnalysisPrompt(profile: UserProfile): string {
    return `Please analyze this student's portfolio using the comprehensive rubric:

STUDENT CONTEXT:
- Grade Level: ${profile.userContext}
- Primary Goal: ${profile.goals.primaryGoal}
- Constraints: ${JSON.stringify(profile.constraints)}
- First-Generation Student: ${profile.demographics.firstGenerationStudent || 'Unknown'}
- Needs Financial Aid: ${profile.constraints.needsFinancialAid}

ACADEMIC PROFILE:
${profile.academicRecord ? `
- GPA: ${profile.academicRecord.gpa} on ${profile.academicRecord.gpaScale} scale
- Class Rank: ${profile.academicRecord.classRank || 'Not provided'} of ${profile.academicRecord.classSize || 'Unknown'}
- Course Rigor: ${profile.academicRecord.coursework.filter(c => ['ap', 'ib', 'honors'].includes(c.level)).length} advanced courses
- Test Scores: ${profile.academicRecord.standardizedTests.map(t => `${t.type}: ${t.score}`).join(', ') || 'None reported'}
` : 'No academic record provided yet'}

EXPERIENCES (${profile.experiences.length} total):
${profile.experiences.slice(0, 5).map(exp => `
- ${exp.title} at ${exp.organization} (${exp.calculateDuration()} months)
  Type: ${exp.type}, Time Commitment: ${exp.timeCommitment}
  Key Achievements: ${exp.achievements.slice(0, 2).join('; ')}
  Skills Demonstrated: ${exp.skillsDemonstrated.map(s => s.skill).join(', ')}
  ${exp.metrics.peopleImpacted ? `People Impacted: ${exp.metrics.peopleImpacted}` : ''}
`).join('\n')}

ACHIEVEMENTS (${profile.achievements.length} total):
${profile.achievements.slice(0, 5).map(ach => `
- ${ach.title} from ${ach.organization}
  Scope: ${ach.scope}, Impact: ${ach.impact}
  ${ach.metrics.selectionRate ? `Selection Rate: ${(ach.metrics.selectionRate * 100).toFixed(1)}%` : ''}
  ${ach.isUnderrecognized ? 'UNDERRECOGNIZED ACHIEVEMENT' : ''}
`).join('\n')}

EXTRACTED SKILLS:
${Array.from(profile.extractedSkills.entries()).slice(0, 10).map(([skill, confidence]) => 
  `- ${skill}: ${(confidence * 100).toFixed(0)}% confidence`
).join('\n')}

HIDDEN STRENGTHS IDENTIFIED:
${profile.hiddenStrengths.join(', ') || 'None identified yet'}

Please provide:
1. Detailed scoring (1-10) for each rubric category with specific evidence
2. Top 3-5 strengths with concrete examples
3. Top 3-5 growth areas with actionable steps
4. Hidden gems - undervalued aspects that should be highlighted
5. Specific next steps prioritized by impact
6. Comparison to similar students (percentile estimate and standout factors)

Remember to consider their constraints and context when evaluating. Focus on growth and potential, not just current achievement.`;
  }

  private buildNarrativeGuidancePrompt(
    experience: Experience | Achievement,
    context: any
  ): string {
    const isExperience = 'responsibilities' in experience;
    
    return `Please provide narrative guidance for this ${isExperience ? 'experience' : 'achievement'}:

${isExperience ? `
EXPERIENCE DETAILS:
- Title: ${experience.title}
- Organization: ${experience.organization}
- Duration: ${(experience as Experience).calculateDuration()} months
- Time Commitment: ${(experience as Experience).timeCommitment}
- Description: ${experience.description}
- Key Responsibilities: ${(experience as Experience).responsibilities.join('; ')}
- Achievements: ${(experience as Experience).achievements.join('; ')}
- Challenges: ${(experience as Experience).challenges.join('; ')}
- Skills Demonstrated: ${(experience as Experience).skillsDemonstrated.map(s => s.skill).join(', ')}
` : `
ACHIEVEMENT DETAILS:
- Title: ${experience.title}
- Organization: ${experience.organization}
- Date: ${(experience as Achievement).dateReceived}
- Scope: ${(experience as Achievement).scope}
- Description: ${experience.description}
- Context: ${JSON.stringify((experience as Achievement).context)}
- Metrics: ${JSON.stringify((experience as Achievement).metrics)}
`}

NARRATIVE CONTEXT:
- Purpose: ${context.purpose}
- Theme: ${context.theme || 'Not specified'}
- Current Draft: ${context.currentDraft ? `"${context.currentDraft}"` : 'No draft yet'}

Please provide:

1. **STORY STRUCTURE ANALYSIS**
   - What's working well structurally?
   - What key elements are missing?
   - Specific suggestions for improvement

2. **EMOTIONAL RESONANCE GUIDANCE**
   - What emotions are present/missing?
   - Where can they add sensory details?
   - Questions to help them access deeper feelings

3. **PERSONAL VOICE DEVELOPMENT**
   - What unique aspects of their voice are showing?
   - Where does it feel generic?
   - How to strengthen their authentic voice

4. **GUIDED QUESTIONS** (5-7 questions)
   - Questions that will help them discover insights
   - Questions that prompt specific details
   - Questions that reveal character/growth

5. **ENHANCEMENT SUGGESTIONS**
   ${context.currentDraft ? 
   '- Specific phrases that could be expanded\n   - Places where more detail would help\n   - Moments that deserve more reflection' :
   '- How to begin their story\n   - What details to include\n   - How to structure their reflection'}

6. **ALTERNATIVE ANGLES**
   - 2-3 different ways they could approach this story
   - Why each angle might be effective
   - What each would reveal about them

Remember: Guide, don't write. Ask questions that help them discover their own insights. Preserve their authentic voice while helping them express themselves more powerfully.`;
  }

  private buildSkillExtractionPrompt(
    experiences: Experience[],
    achievements: Achievement[]
  ): string {
    return `Please perform deep skill extraction and analysis:

EXPERIENCES:
${experiences.map(exp => `
- ${exp.title} at ${exp.organization}
  Responsibilities: ${exp.responsibilities.join('; ')}
  Achievements: ${exp.achievements.join('; ')}
  Challenges Overcome: ${exp.challenges.join('; ')}
  Time Investment: ${exp.timeCommitment} for ${exp.calculateDuration()} months
`).join('\n')}

ACHIEVEMENTS:
${achievements.map(ach => `
- ${ach.title}: ${ach.description}
  Context: Required ${ach.context.effort}
  Significance: ${ach.context.significance}
`).join('\n')}

Please identify:

1. **OBVIOUS SKILLS** with evidence
   - Technical skills
   - Soft skills
   - Domain-specific skills

2. **HIDDEN SKILLS** that aren't explicitly stated
   - What skills were required but not mentioned?
   - What does the context suggest about abilities?
   - What skills are implied by their success?

3. **TRANSFERABLE SKILLS** and their applications
   - How do these skills apply to other fields?
   - What professional contexts value these skills?
   - How do they combine uniquely?

4. **CROSS-FUNCTIONAL ABILITIES**
   - Skills that bridge multiple domains
   - Unusual skill combinations
   - Meta-skills demonstrated

5. **EMERGING STRENGTHS**
   - Early indicators of exceptional ability
   - Patterns suggesting future potential
   - Growth trajectories observed

For each skill, provide:
- Specific behavioral evidence
- Confidence level (0-1)
- Professional contexts where valuable
- Development suggestions

Remember to look beyond the obvious and find the exceptional in the everyday.`;
  }

  // Result Validation and Processing

  private validateAndEnrichAnalysisResult(
    result: any,
    profile: UserProfile
  ): PortfolioAnalysisResult {
    // Ensure all required fields are present
    const validated: PortfolioAnalysisResult = {
      overallScore: result.overallScore || 0,
      rubricScores: {
        academicExcellence: this.validateRubricScore(result.rubricScores?.academicExcellence),
        leadershipPotential: this.validateRubricScore(result.rubricScores?.leadershipPotential),
        personalGrowth: this.validateRubricScore(result.rubricScores?.personalGrowth),
        communityImpact: this.validateRubricScore(result.rubricScores?.communityImpact),
        uniqueValue: this.validateRubricScore(result.rubricScores?.uniqueValue),
        futureReadiness: this.validateRubricScore(result.rubricScores?.futureReadiness)
      },
      strengths: result.strengths || [],
      growthAreas: result.growthAreas || [],
      hiddenGems: result.hiddenGems || [],
      actionableSteps: result.actionableSteps || [],
      peerComparison: result.peerComparison || {
        percentile: 50,
        standoutFactors: [],
        competitiveGaps: [],
        uniqueAdvantages: []
      }
    };

    // Add context-specific insights
    if (profile.demographics.firstGenerationStudent) {
      validated.hiddenGems.push({
        category: 'Background',
        insight: 'First-generation college student status demonstrates exceptional navigation of unfamiliar systems',
        evidence: 'Breaking generational educational barriers',
        significance: 'high'
      });
    }

    return validated;
  }

  private validateRubricScore(score: any): RubricScore {
    return {
      score: score?.score || 0,
      evidence: score?.evidence || [],
      feedback: score?.feedback || '',
      improvementSuggestions: score?.improvementSuggestions || []
    };
  }

  private validateNarrativeGuidanceResult(result: any): NarrativeGuidanceResult {
    return {
      authenticityScore: result.authenticityScore || 0,
      storyStructure: {
        hasCompellingHook: result.storyStructure?.hasCompellingHook || false,
        hasConcreteDetails: result.storyStructure?.hasConcreteDetails || false,
        hasPersonalReflection: result.storyStructure?.hasPersonalReflection || false,
        hasClearGrowth: result.storyStructure?.hasClearGrowth || false,
        suggestedImprovements: result.storyStructure?.suggestedImprovements || []
      },
      emotionalResonance: {
        emotionalDepth: result.emotionalResonance?.emotionalDepth || 0,
        vulnerabilityPresent: result.emotionalResonance?.vulnerabilityPresent || false,
        authenticEmotions: result.emotionalResonance?.authenticEmotions || [],
        suggestedEmotionalElements: result.emotionalResonance?.suggestedEmotionalElements || []
      },
      personalVoice: {
        voiceConsistency: result.personalVoice?.voiceConsistency || 0,
        uniquePhrases: result.personalVoice?.uniquePhrases || [],
        personalityTraits: result.personalVoice?.personalityTraits || [],
        voiceStrengthening: result.personalVoice?.voiceStrengthening || []
      },
      guidedQuestions: result.guidedQuestions || [],
      enhancementSuggestions: result.enhancementSuggestions || [],
      alternativeAngles: result.alternativeAngles || []
    };
  }

  private processSkillExtractionResult(result: any): any {
    const skills = new Map<string, SkillAnalysis>();
    
    // Process obvious skills
    if (result.obviousSkills) {
      result.obviousSkills.forEach((skill: any) => {
        skills.set(skill.name, {
          type: 'obvious',
          confidence: skill.confidence,
          evidence: skill.evidence,
          transferability: skill.transferability
        });
      });
    }

    // Process hidden skills
    if (result.hiddenSkills) {
      result.hiddenSkills.forEach((skill: any) => {
        skills.set(skill.name, {
          type: 'hidden',
          confidence: skill.confidence,
          evidence: skill.evidence,
          transferability: skill.transferability
        });
      });
    }

    return {
      skills,
      hiddenStrengths: result.hiddenStrengths || [],
      crossFunctionalAbilities: result.crossFunctionalAbilities || []
    };
  }
}

// Supporting Types

interface SkillAnalysis {
  type: 'obvious' | 'hidden' | 'emerging';
  confidence: number;
  evidence: string[];
  transferability: string[];
}

interface HiddenStrength {
  strength: string;
  evidence: string[];
  marketValue: string;
  developmentPath: string;
}

export {
  PortfolioAnalysisResult,
  NarrativeGuidanceResult,
  AIIntegrationService
};