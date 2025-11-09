import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user's latest skin analysis
    const { data: skinAnalysis, error: analysisError } = await supabaseClient
      .from('skin_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError) {
      console.error('Error fetching skin analysis:', analysisError);
      throw new Error('No skin analysis found. Please complete a skin scan first.');
    }

    // Get user's product recommendations with product details
    const { data: recommendations, error: recsError } = await supabaseClient
      .from('product_recommendations')
      .select(`
        *,
        products (
          id,
          name,
          brand,
          category,
          description,
          benefits,
          skin_types
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recsError) {
      console.error('Error fetching recommendations:', recsError);
    }

    const systemPrompt = `You are an expert dermatologist and skincare specialist. Create a comprehensive, personalized skincare routine based on the user's skin analysis and recommended products.

Your response must be in Indonesian and follow this EXACT JSON structure:
{
  "morning_routine": {
    "routine_name": "Rutinitas Pagi",
    "steps": [
      {
        "order": 1,
        "step_name": "Pembersih",
        "product_name": "Nama Produk",
        "product_id": "uuid or null",
        "instructions": "Cara penggunaan detail",
        "why": "Alasan mengapa step ini penting"
      }
    ]
  },
  "evening_routine": {
    "routine_name": "Rutinitas Malam",
    "steps": [
      {
        "order": 1,
        "step_name": "Pembersih",
        "product_name": "Nama Produk",
        "product_id": "uuid or null",
        "instructions": "Cara penggunaan detail",
        "why": "Alasan mengapa step ini penting"
      }
    ]
  },
  "weekly_treatments": [
    {
      "treatment_name": "Eksfoliasi",
      "frequency": "2x seminggu",
      "product_name": "Nama Produk",
      "product_id": "uuid or null",
      "instructions": "Cara penggunaan detail",
      "why": "Manfaat treatment ini"
    }
  ],
  "tips": [
    "Tip perawatan kulit 1",
    "Tip perawatan kulit 2",
    "Tip perawatan kulit 3"
  ]
}

Important guidelines:
1. Create realistic, practical routines (5-8 steps max for each routine)
2. Use recommended products when available, match by product_id from the recommendations
3. If recommended products don't cover all steps, suggest general product types (with product_id as null)
4. Consider the user's skin type and detected issues
5. Provide clear, actionable instructions in Indonesian
6. Include morning and evening routines, plus weekly treatments
7. Add practical tips for maintaining healthy skin`;

    const userPrompt = `
Skin Analysis:
- Skin Type: ${skinAnalysis.skin_type}
- Detected Issues: ${JSON.stringify(skinAnalysis.detected_issues)}
- Detailed Analysis: ${skinAnalysis.detailed_analysis}
- Recommendations: ${skinAnalysis.recommendations}

Recommended Products:
${recommendations && recommendations.length > 0 ? recommendations.map((rec: any) => 
  `- ${rec.products?.name || 'Unknown'} by ${rec.products?.brand || 'Unknown'} (ID: ${rec.product_id})
   Category: ${rec.products?.category || 'N/A'}
   Benefits: ${rec.products?.benefits || 'N/A'}
   Reason: ${rec.reason || 'N/A'}`
).join('\n') : 'No specific product recommendations available yet.'}

Please create a comprehensive, personalized skincare routine for this user.`;

    console.log('Calling Lovable AI for routine generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI routine generation failed');
    }

    const data = await response.json();
    const routineText = data.choices[0].message.content;
    
    console.log('AI Routine response:', routineText);
    
    let routine;
    try {
      routine = JSON.parse(routineText);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response');
    }

    return new Response(JSON.stringify({ routine }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-personalized-routine:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
