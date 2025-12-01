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

    const systemPrompt = `Anda adalah AI dermatologist expert. Analisis foto wajah yang dikirimkan dan berikan:
1. Jenis kulit (oily, dry, combination, normal, sensitive, acne-prone)
2. Masalah kulit yang terdeteksi (redness, enlarged pores, acne, dark spots, fine lines, dll)
3. Skin health score (0-100, dimana 100 adalah kulit sempurna)
4. Confidence score (0.0-1.0)
5. Rekomendasi perawatan yang detail dan personal

PENTING: skin_health_score harus berupa angka 0-100. Hitung berdasarkan:
- Kulit sempurna tanpa masalah = 90-100
- Masalah minor (1-2 issues) = 70-89
- Masalah sedang (3-4 issues) = 50-69
- Masalah banyak (5+ issues) = 30-49
- Kondisi parah = 0-29

Format response dalam JSON:
{
  "skin_type": "jenis kulit",
  "detected_issues": ["masalah1", "masalah2"],
  "skin_health_score": 75,
  "confidence_score": 0.85,
  "detailed_analysis": "analisis lengkap dalam bahasa Indonesia",
  "recommendations": "rekomendasi perawatan lengkap"
}`;

    console.log('Calling Lovable AI for skin analysis...');

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
              { type: 'text', text: 'Analisis foto kulit wajah ini secara detail. Berikan skin_health_score dalam rentang 0-100.' },
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
      
      // Validate and ensure skin_health_score exists (0-100)
      if (typeof analysis.skin_health_score !== 'number' || analysis.skin_health_score < 0 || analysis.skin_health_score > 100) {
        // Calculate fallback score based on detected issues
        const issuesCount = Array.isArray(analysis.detected_issues) ? analysis.detected_issues.length : 0;
        const baseScore = 85;
        analysis.skin_health_score = Math.max(20, baseScore - (issuesCount * 10));
        console.log('Calculated fallback skin_health_score:', analysis.skin_health_score);
      }
      
      // Ensure confidence_score is valid (0.0-1.0)
      if (typeof analysis.confidence_score !== 'number' || analysis.confidence_score < 0 || analysis.confidence_score > 1) {
        analysis.confidence_score = 0.75; // Default confidence
      }
      
      // Ensure detected_issues is an array
      if (!Array.isArray(analysis.detected_issues)) {
        analysis.detected_issues = [];
      }
      
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Return fallback analysis instead of throwing error
      analysis = {
        skin_type: "normal",
        detected_issues: [],
        skin_health_score: 70,
        confidence_score: 0.5,
        detailed_analysis: "Maaf, analisis gambar tidak dapat diproses dengan sempurna. Silakan coba lagi dengan foto yang lebih jelas.",
        recommendations: "Untuk hasil terbaik, pastikan foto diambil dalam pencahayaan yang baik dan wajah terlihat jelas."
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-skin-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
