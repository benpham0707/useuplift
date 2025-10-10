// IMPORTANT: Hard-coded data values and mock scores for demonstration
// In production, these would be calculated from actual user data

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PortfolioData {
  profile: any;
  academic: any;
  experiences: any;
  personal_growth: any;
  goals: any;
  personal_info: any;
  family_responsibilities: any;
  support_network: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching portfolio data for user: ${user.id}`);

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all portfolio data in parallel
    const [
      { data: academic },
      { data: experiences },
      { data: personal_growth },
      { data: goals },
      { data: personal_info },
      { data: family_responsibilities },
      { data: support_network }
    ] = await Promise.all([
      supabase.from('academic_journey').select('*').eq('profile_id', profile.id).maybeSingle(),
      supabase.from('experiences_activities').select('*').eq('profile_id', profile.id).maybeSingle(),
      supabase.from('personal_growth').select('*').eq('profile_id', profile.id).maybeSingle(),
      supabase.from('goals_aspirations').select('*').eq('profile_id', profile.id).maybeSingle(),
      supabase.from('personal_information').select('*').eq('profile_id', profile.id).maybeSingle(),
      supabase.from('family_responsibilities').select('*').eq('profile_id', profile.id).maybeSingle(),
      supabase.from('support_network').select('*').eq('profile_id', profile.id).maybeSingle(),
    ]);

    const portfolioData: PortfolioData = {
      profile,
      academic,
      experiences,
      personal_growth,
      goals,
      personal_info,
      family_responsibilities,
      support_network
    };

    console.log('Analyzing portfolio with AI...');

    // Call AI to analyze portfolio
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert college admissions analyst. Analyze student portfolios and provide detailed insights on their college readiness across multiple dimensions. 

Your analysis should evaluate:
1. Academic Excellence (coursework rigor, GPA, test scores, academic achievements)
2. Leadership Potential (leadership roles, team management, initiative)
3. Intellectual Curiosity (research, independent projects, exploration beyond curriculum)
4. Community Impact (volunteer work, social responsibility, service)
5. Future Readiness (clear goals, preparedness, adaptability)
6. Overall Portfolio Strength (holistic assessment)

Return your analysis as a JSON object with this exact structure:
{
  "overall": number (0-10),
  "dimensions": {
    "academicExcellence": { "score": number (0-10), "strengths": string[], "growthAreas": string[], "feedback": string },
    "leadershipPotential": { "score": number (0-10), "strengths": string[], "growthAreas": string[], "feedback": string },
    "futureReadiness": { "score": number (0-10), "strengths": string[], "growthAreas": string[], "feedback": string },
    "communityImpact": { "score": number (0-10), "strengths": string[], "growthAreas": string[], "feedback": string }
  },
  "detailed": {
    "overallScore": number (0-10),
    "narrativeSummary": string,
    "hiddenStrengths": string[],
    "prioritizedRecommendations": [
      { "priority": number (1=high, 2=medium, 3=low), "action": string, "impact": string, "timeline": string, "rationale": string }
    ]
  }
}

Be thorough but concise. Provide 2-3 strengths and 2 growth areas per dimension. Keep feedback under 100 words. Identify 5-7 hidden strengths (unique combinations of skills/experiences). Provide 4-6 prioritized recommendations.`
          },
          {
            role: 'user',
            content: `Analyze this student's portfolio:\n\n${JSON.stringify(portfolioData, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI analysis complete');

    const analysis = JSON.parse(aiResult.choices[0].message.content);

    // Return the structured response
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
