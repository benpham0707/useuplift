
import { NextResponse } from 'next/server';
import { runSurgicalWorkshop } from '@/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '@/services/narrativeWorkshop/types';

export const runtime = 'nodejs'; // Required for the backend logic (fs, etc. if needed, though mostly API calls)
export const maxDuration = 60; // Increase timeout for Vercel (60s)

export async function POST(request: Request) {
  try {
    // 1. Parse Body
    const body = await request.json();
    const { essayText, essayType, promptText } = body;

    if (!essayText) {
      return NextResponse.json(
        { error: 'Essay text is required.' },
        { status: 400 }
      );
    }

    // 2. Validate API Key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY missing in environment.');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API Key.' },
        { status: 500 }
      );
    }

    // 3. Prepare Input
    const input: NarrativeEssayInput = {
      essayText,
      essayType: essayType || 'college_essay',
      promptText: promptText || '',
    };

    console.log(`🚀 [API] Starting Surgical Workshop for essay (${essayText.length} chars)...`);

    // 4. Run Orchestrator
    const result = await runSurgicalWorkshop(input);

    console.log(`✅ [API] Workshop Complete. ID: ${result.analysisId}, Score: ${result.overallScore}`);

    // 5. Return Result
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ [API] Surgical Workshop Failed:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


