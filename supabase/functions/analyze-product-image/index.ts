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
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Anda adalah AI product analyzer expert untuk skincare. Analisis foto produk skincare yang dikirimkan dan berikan:
1. Nama produk (jika terdeteksi)
2. Ingredients yang terdeteksi dari foto
3. Allergens (bahan yang berpotensi menyebabkan alergi)
4. Irritants (bahan yang berpotensi menyebabkan iritasi)
5. Safety score (0.0-1.0, dimana 1.0 = sangat aman)
6. Apakah perlu patch test
7. Summary analisis
8. Rekomendasi penggunaan

Format response dalam JSON:
{
  "product_name": "nama produk atau 'Unknown Product'",
  "ingredients_detected": ["ingredient1", "ingredient2"],
  "allergens": {
    "items": ["allergen1", "allergen2"],
    "severity": "low/medium/high"
  },
  "irritants": {
    "items": ["irritant1", "irritant2"],
    "severity": "low/medium/high"
  },
  "safety_score": 0.xx,
  "patch_test_recommended": true/false,
  "analysis_summary": "ringkasan analisis dalam bahasa Indonesia",
  "recommendations": "rekomendasi penggunaan produk"
}`;

    console.log('Calling Lovable AI for product analysis...');

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
              { type: 'text', text: 'Analisis produk skincare ini dan identifikasi potensi allergen dan irritant.' },
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
    
    console.log('AI Analysis response:', analysisText);
    
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
    console.error('Error in analyze-product-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
