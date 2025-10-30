import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, hasHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = hasHistory 
      ? `Anda adalah AI dermatologist yang menganalisis progress kulit. Analisis foto ini dan bandingkan dengan kondisi baseline.
Berikan analisis DETAIL dan SPESIFIK tentang:
1. Perubahan tekstur kulit (smoother, rougher, dll)
2. Perubahan warna kulit (lebih cerah, merata, dll)
3. Perubahan pada kemerahan atau iritasi
4. Perubahan pada pori-pori
5. Perubahan pada jerawat atau noda
6. Perubahan pada hidrasi kulit
7. Improvement percentage untuk setiap aspek

Format response dalam JSON:
{
  "improvements": {
    "texture": { "status": "improved/worse/same", "percentage": "+20%", "detail": "deskripsi detail" },
    "tone": { "status": "improved/worse/same", "percentage": "+15%", "detail": "deskripsi detail" },
    "redness": { "status": "improved/worse/same", "percentage": "-25%", "detail": "deskripsi detail" },
    "pores": { "status": "improved/worse/same", "percentage": "-10%", "detail": "deskripsi detail" },
    "acne": { "status": "improved/worse/same", "percentage": "-30%", "detail": "deskripsi detail" },
    "hydration": { "status": "improved/worse/same", "percentage": "+18%", "detail": "deskripsi detail" }
  },
  "summary": "ringkasan lengkap progress dengan kata-kata yang memotivasi",
  "recommendations": "rekomendasi untuk terus meningkatkan kondisi kulit"
}`
      : `Anda adalah AI dermatologist. Ini adalah foto baseline pertama. Analisis kondisi kulit saat ini dengan detail.

Format response dalam JSON:
{
  "baseline_analysis": {
    "texture": "deskripsi tekstur kulit",
    "tone": "deskripsi warna dan meratanya kulit",
    "concerns": ["concern1", "concern2"],
    "strengths": ["kekuatan1", "kekuatan2"]
  },
  "summary": "ringkasan kondisi kulit baseline",
  "recommendations": "rekomendasi untuk foto tracking berikutnya"
}`;

    console.log('Calling Lovable AI for progress analysis...');

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
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: hasHistory 
                  ? 'Analisis foto progress kulit ini dan berikan detail improvement.' 
                  : 'Analisis foto baseline kulit ini dengan detail.'
              },
              { 
                type: 'image_url', 
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
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
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('AI Progress analysis response:', analysisText);
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response');
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-progress-photo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
