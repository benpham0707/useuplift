#!/usr/bin/env node

/**
 * UPLIFT PORTFOLIO MCP SERVER
 *
 * Model Context Protocol server providing complete student portfolio intelligence
 * for essay analysis, claim validation, and strategic guidance.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { initializeSupabase } from './database/supabaseClientTestable.js';
import { tools, toolSchemas } from './tools/index.js';

// Initialize Supabase on startup
initializeSupabase();

// Create MCP server
const server = new Server(
  {
    name: 'uplift-portfolio',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    },
  }
);

// ============================================================================
// TOOL HANDLERS
// ============================================================================

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_student_profile',
        description: 'Get complete student profile including demographics, goals, academic info, activities, and family context. Essential for understanding student background before analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_extracurriculars',
        description: 'Get all extracurricular activities, work experience, volunteer service, and leadership roles. Use for validating activity claims in essays.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            },
            include_leadership_only: {
              type: 'boolean',
              description: 'If true, only return activities with leadership roles',
              default: false
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_academic_context',
        description: 'Get academic information including GPA, test scores, course rigor, AP/IB exams. Use for validating academic claims.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_context_circumstances',
        description: 'Get student context including family responsibilities, challenging circumstances, first-gen status, financial need. Critical for Context & Circumstances dimension.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'check_repetition',
        description: 'Check if current essay repeats content from other essays (personal statement, other PIQs, supplements). Returns similarity scores and overlapping content.',
        inputSchema: {
          type: 'object',
          properties: {
            current_essay_text: {
              type: 'string',
              description: 'The essay text to check for repetition'
            },
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['current_essay_text', 'user_id']
        }
      },
      {
        name: 'validate_claim',
        description: 'Validate if an essay claim is backed by student data. Checks leadership claims against activity list, academic claims against transcripts, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            claim: {
              type: 'string',
              description: 'The claim to validate (e.g., "I am president of 3 clubs")'
            },
            claim_type: {
              type: 'string',
              enum: ['leadership', 'activity', 'achievement', 'academic'],
              description: 'Type of claim being made'
            },
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['claim', 'claim_type', 'user_id']
        }
      },
      {
        name: 'suggest_piq_prompts',
        description: 'Recommend which UC PIQ prompts (1-8) align best with student\'s actual experiences, activities, and background. Returns fit scores and rationale.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            },
            already_written: {
              type: 'array',
              items: {
                type: 'number',
                minimum: 1,
                maximum: 8
              },
              description: 'PIQ numbers already written (1-8)',
              default: []
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_better_stories',
        description: 'Suggest alternative stories from student\'s activity list that might be stronger fits for a specific PIQ prompt. Returns ranked alternatives with rationale.',
        inputSchema: {
          type: 'object',
          properties: {
            current_essay_text: {
              type: 'string',
              description: 'Current essay draft'
            },
            piq_prompt_number: {
              type: 'number',
              minimum: 1,
              maximum: 8,
              description: 'Which PIQ prompt (1-8)'
            },
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['current_essay_text', 'piq_prompt_number', 'user_id']
        }
      },
      {
        name: 'get_all_essays',
        description: 'Get all essays for a student including personal statement, PIQs, and supplements. Optionally include analysis reports.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            },
            include_analysis: {
              type: 'boolean',
              description: 'Include analysis reports for each essay',
              default: false
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_portfolio_analytics',
        description: 'Get comprehensive portfolio analytics including dimension coverage across all essays, gaps, and strengths.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'analyze_portfolio_balance',
        description: 'Evaluate if a set of chosen PIQ essays creates a well-rounded application. Returns dimension coverage, gaps, overlaps, and suggestions.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            },
            piq_numbers: {
              type: 'array',
              items: {
                type: 'number',
                minimum: 1,
                maximum: 8
              },
              description: 'Which PIQ prompts chosen (1-8), typically 4 PIQs'
            }
          },
          required: ['user_id', 'piq_numbers']
        }
      },
      {
        name: 'check_narrative_consistency',
        description: 'Check for contradictions across all essays using fact graph analysis. Detects name inconsistencies, date conflicts, role contradictions.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'UUID of the user'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'analyze_full_application',
        description: 'Run the comprehensive 13-dimension essay analysis + holistic profile validation. Returns deep insights, narrative spine, and strategic positioning.',
        inputSchema: {
          type: 'object',
          properties: {
            essay_text: {
              type: 'string',
              description: 'The full text of the essay to analyze'
            },
            prompt_type: {
              type: 'string',
              enum: [
                'piq1_leadership',
                'piq2_creative',
                'piq3_talent',
                'piq4_educational',
                'piq5_challenge',
                'piq6_academic',
                'piq7_community',
                'piq8_open_ended'
              ],
              description: 'The PIQ prompt type'
            },
            user_id: {
              type: 'string',
              description: 'UUID of the user (to fetch profile context)'
            }
          },
          required: ['essay_text', 'prompt_type', 'user_id']
        }
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_student_profile': {
        const input = toolSchemas.get_student_profile.parse(args);
        const result = await tools.get_student_profile(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_extracurriculars': {
        const input = toolSchemas.get_extracurriculars.parse(args);
        const result = await tools.get_extracurriculars(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_academic_context': {
        const input = toolSchemas.get_academic_context.parse(args);
        const result = await tools.get_academic_context(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_context_circumstances': {
        const input = toolSchemas.get_context_circumstances.parse(args);
        const result = await tools.get_context_circumstances(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'check_repetition': {
        const input = toolSchemas.check_repetition.parse(args);
        const result = await tools.check_repetition(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'validate_claim': {
        const input = toolSchemas.validate_claim.parse(args);
        const result = await tools.validate_claim(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'suggest_piq_prompts': {
        const input = toolSchemas.suggest_piq_prompts.parse(args);
        const result = await tools.suggest_piq_prompts(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_better_stories': {
        const input = toolSchemas.get_better_stories.parse(args);
        const result = await tools.get_better_stories(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_all_essays': {
        const input = toolSchemas.get_all_essays.parse(args);
        const result = await tools.get_all_essays(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_portfolio_analytics': {
        const input = toolSchemas.get_portfolio_analytics.parse(args);
        const result = await tools.get_portfolio_analytics(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'analyze_portfolio_balance': {
        const input = toolSchemas.analyze_portfolio_balance.parse(args);
        const result = await tools.analyze_portfolio_balance(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'check_narrative_consistency': {
        const input = toolSchemas.check_narrative_consistency.parse(args);
        const result = await tools.check_narrative_consistency(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'analyze_full_application': {
        const input = toolSchemas.analyze_full_application.parse(args);
        const result = await tools.analyze_full_application(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            tool: name
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// ============================================================================
// RESOURCE HANDLERS (Optional - for future implementation)
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: []
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async () => {
  throw new Error('Resources not yet implemented');
});

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Uplift Portfolio MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
