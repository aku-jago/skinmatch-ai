import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default routines based on skin type
const getDefaultRoutine = (skinType: string) => {
  const baseRoutines: Record<string, any> = {
    oily: {
      morning_routine: {
        routine_name: "Rutinitas Pagi untuk Kulit Berminyak",
        steps: [
          { order: 1, step_name: "Pembersih", product_name: "Gel Cleanser", product_id: null, instructions: "Cuci wajah dengan pembersih berbasis gel, pijat lembut selama 60 detik", why: "Membersihkan minyak berlebih tanpa mengeringkan kulit" },
          { order: 2, step_name: "Toner", product_name: "Hydrating Toner", product_id: null, instructions: "Aplikasikan toner dengan kapas atau tepuk-tepuk dengan tangan", why: "Menyeimbangkan pH kulit dan mengecilkan pori" },
          { order: 3, step_name: "Serum", product_name: "Niacinamide Serum", product_id: null, instructions: "Gunakan 2-3 tetes, ratakan ke seluruh wajah", why: "Mengontrol produksi minyak dan memperbaiki tekstur kulit" },
          { order: 4, step_name: "Pelembab", product_name: "Oil-Free Moisturizer", product_id: null, instructions: "Gunakan pelembab berbahan ringan, hindari area T-zone jika perlu", why: "Menjaga hidrasi tanpa menambah minyak" },
          { order: 5, step_name: "Sunscreen", product_name: "Gel Sunscreen SPF 50", product_id: null, instructions: "Aplikasikan sunscreen secukupnya, reapply setiap 2 jam", why: "Melindungi dari sinar UV yang dapat memicu produksi minyak" }
        ]
      },
      evening_routine: {
        routine_name: "Rutinitas Malam untuk Kulit Berminyak",
        steps: [
          { order: 1, step_name: "Double Cleanse - Oil", product_name: "Cleansing Oil", product_id: null, instructions: "Pijat wajah dengan cleansing oil selama 1 menit saat kering", why: "Mengangkat sunscreen dan kotoran berbasis minyak" },
          { order: 2, step_name: "Double Cleanse - Water", product_name: "Gel Cleanser", product_id: null, instructions: "Lanjutkan dengan pembersih gel berbusa", why: "Membersihkan sisa kotoran dan menyegarkan kulit" },
          { order: 3, step_name: "Toner", product_name: "Exfoliating Toner", product_id: null, instructions: "Gunakan toner dengan BHA 2-3x seminggu", why: "Eksfoliasi lembut untuk mencegah pori tersumbat" },
          { order: 4, step_name: "Serum", product_name: "Retinol Serum", product_id: null, instructions: "Gunakan retinol 2-3x seminggu, mulai dari konsentrasi rendah", why: "Mempercepat regenerasi sel dan mengontrol minyak" },
          { order: 5, step_name: "Pelembab Malam", product_name: "Light Night Cream", product_id: null, instructions: "Gunakan pelembab ringan sebelum tidur", why: "Menjaga hidrasi selama tidur" }
        ]
      },
      weekly_treatments: [
        { treatment_name: "Clay Mask", frequency: "1-2x seminggu", product_name: "Kaolin Clay Mask", product_id: null, instructions: "Aplikasikan pada area T-zone, diamkan 10-15 menit", why: "Menyerap minyak berlebih dan membersihkan pori" }
      ],
      tips: [
        "Jangan skip pelembab meskipun kulit berminyak - dehidrasi justru memicu produksi minyak lebih banyak",
        "Gunakan blotting paper di siang hari untuk menyerap minyak tanpa merusak makeup",
        "Hindari produk dengan alkohol tinggi yang dapat mengeringkan dan memicu rebound oil"
      ]
    },
    dry: {
      morning_routine: {
        routine_name: "Rutinitas Pagi untuk Kulit Kering",
        steps: [
          { order: 1, step_name: "Pembersih", product_name: "Cream Cleanser", product_id: null, instructions: "Gunakan pembersih krim yang lembut, hindari air terlalu panas", why: "Membersihkan tanpa menghilangkan kelembaban alami kulit" },
          { order: 2, step_name: "Toner", product_name: "Hydrating Toner", product_id: null, instructions: "Aplikasikan dengan cara patting pada kulit yang masih lembab", why: "Memberikan lapisan hidrasi ekstra" },
          { order: 3, step_name: "Serum", product_name: "Hyaluronic Acid Serum", product_id: null, instructions: "Gunakan pada kulit lembab untuk efek maksimal", why: "Menarik dan mengunci kelembaban di kulit" },
          { order: 4, step_name: "Pelembab", product_name: "Rich Moisturizer", product_id: null, instructions: "Gunakan pelembab kaya secara berlapis jika perlu", why: "Mengunci semua kelembaban dan memperkuat skin barrier" },
          { order: 5, step_name: "Sunscreen", product_name: "Moisturizing Sunscreen SPF 50", product_id: null, instructions: "Pilih sunscreen dengan tambahan pelembab", why: "Melindungi dari UV yang dapat memperparah kekeringan" }
        ]
      },
      evening_routine: {
        routine_name: "Rutinitas Malam untuk Kulit Kering",
        steps: [
          { order: 1, step_name: "Double Cleanse - Balm", product_name: "Cleansing Balm", product_id: null, instructions: "Gunakan cleansing balm yang melting untuk mengangkat makeup", why: "Membersihkan dengan lembut tanpa stripping" },
          { order: 2, step_name: "Double Cleanse - Cream", product_name: "Cream Cleanser", product_id: null, instructions: "Lanjutkan dengan pembersih krim", why: "Membersihkan sambil menjaga kelembaban" },
          { order: 3, step_name: "Toner", product_name: "Hydrating Essence", product_id: null, instructions: "Layer 2-3 kali untuk hidrasi maksimal", why: "Teknik 7-skin untuk hidrasi intensif" },
          { order: 4, step_name: "Serum", product_name: "Ceramide Serum", product_id: null, instructions: "Fokus pada area yang paling kering", why: "Memperbaiki dan memperkuat skin barrier" },
          { order: 5, step_name: "Night Cream", product_name: "Rich Night Cream", product_id: null, instructions: "Gunakan pelembab kaya sebagai langkah terakhir", why: "Memberikan nutrisi intensif saat tidur" },
          { order: 6, step_name: "Face Oil", product_name: "Facial Oil", product_id: null, instructions: "Teteskan 2-3 tetes dan tekan lembut ke wajah", why: "Mengunci semua kelembaban semalaman" }
        ]
      },
      weekly_treatments: [
        { treatment_name: "Hydrating Mask", frequency: "2-3x seminggu", product_name: "Sheet Mask / Sleeping Mask", product_id: null, instructions: "Gunakan sheet mask 15-20 menit atau sleeping mask semalaman", why: "Memberikan hidrasi intensif" }
      ],
      tips: [
        "Selalu aplikasikan skincare pada kulit yang masih lembab untuk mengunci kelembaban",
        "Gunakan humidifier di ruangan ber-AC untuk menjaga kelembaban udara",
        "Hindari air panas saat mencuci wajah - gunakan air hangat atau suam-suam kuku"
      ]
    },
    normal: {
      morning_routine: {
        routine_name: "Rutinitas Pagi untuk Kulit Normal",
        steps: [
          { order: 1, step_name: "Pembersih", product_name: "Gentle Cleanser", product_id: null, instructions: "Cuci wajah dengan pembersih lembut", why: "Membersihkan tanpa mengganggu keseimbangan kulit" },
          { order: 2, step_name: "Toner", product_name: "Balancing Toner", product_id: null, instructions: "Aplikasikan untuk menyegarkan kulit", why: "Menyeimbangkan pH kulit" },
          { order: 3, step_name: "Serum", product_name: "Vitamin C Serum", product_id: null, instructions: "Gunakan serum antioksidan di pagi hari", why: "Melindungi dari radikal bebas dan mencerahkan" },
          { order: 4, step_name: "Pelembab", product_name: "Light Moisturizer", product_id: null, instructions: "Gunakan pelembab secukupnya", why: "Menjaga hidrasi kulit" },
          { order: 5, step_name: "Sunscreen", product_name: "Sunscreen SPF 50", product_id: null, instructions: "Aplikasikan sunscreen sebagai langkah terakhir", why: "Melindungi dari kerusakan akibat sinar UV" }
        ]
      },
      evening_routine: {
        routine_name: "Rutinitas Malam untuk Kulit Normal",
        steps: [
          { order: 1, step_name: "Double Cleanse", product_name: "Cleansing Oil + Gentle Cleanser", product_id: null, instructions: "Bersihkan wajah dengan double cleansing", why: "Membersihkan sunscreen dan kotoran secara menyeluruh" },
          { order: 2, step_name: "Toner", product_name: "Hydrating Toner", product_id: null, instructions: "Aplikasikan toner untuk hidrasi", why: "Mempersiapkan kulit untuk langkah selanjutnya" },
          { order: 3, step_name: "Serum", product_name: "Niacinamide atau Retinol", product_id: null, instructions: "Bergantian serum sesuai kebutuhan", why: "Merawat kulit sesuai concern spesifik" },
          { order: 4, step_name: "Pelembab Malam", product_name: "Night Moisturizer", product_id: null, instructions: "Gunakan pelembab yang sedikit lebih kaya", why: "Memperbaiki kulit saat tidur" }
        ]
      },
      weekly_treatments: [
        { treatment_name: "Eksfoliasi", frequency: "1-2x seminggu", product_name: "AHA/BHA Exfoliant", product_id: null, instructions: "Gunakan eksfoliator kimia lembut", why: "Mengangkat sel kulit mati dan mencerahkan" }
      ],
      tips: [
        "Kulit normal cenderung toleran - ini saat yang tepat untuk mencoba ingredients aktif",
        "Tetap konsisten dengan rutinitas dasar meskipun kulit terlihat baik",
        "Perhatikan perubahan musim yang bisa mempengaruhi kondisi kulit"
      ]
    }
  };

  // Default to normal if skin type not found
  return baseRoutines[skinType.toLowerCase()] || baseRoutines.normal;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header, returning default routine');
      const defaultRoutine = getDefaultRoutine('normal');
      return new Response(
        JSON.stringify({ routine: defaultRoutine, isDefault: true, error: 'Silakan login terlebih dahulu' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.log('User not authenticated, returning default routine');
      const defaultRoutine = getDefaultRoutine('normal');
      return new Response(
        JSON.stringify({ routine: defaultRoutine, isDefault: true, error: 'User tidak terautentikasi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      .maybeSingle();

    // Get user profile for fallback skin type
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('skin_type')
      .eq('id', user.id)
      .maybeSingle();

    const skinType = skinAnalysis?.skin_type || profile?.skin_type || 'normal';
    
    // If no skin analysis exists, return default routine based on skin type
    if (!skinAnalysis) {
      console.log('No skin analysis found, returning default routine for:', skinType);
      const defaultRoutine = getDefaultRoutine(skinType);
      return new Response(JSON.stringify({ routine: defaultRoutine }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's product recommendations with product details
    const { data: recommendations } = await supabaseClient
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
        console.log('Rate limit exceeded, returning default routine');
        const defaultRoutine = getDefaultRoutine(skinType);
        return new Response(JSON.stringify({ routine: defaultRoutine, isDefault: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.log('Payment required, returning default routine');
        const defaultRoutine = getDefaultRoutine(skinType);
        return new Response(JSON.stringify({ routine: defaultRoutine, isDefault: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      // Return default routine instead of throwing error
      const defaultRoutine = getDefaultRoutine(skinType);
      return new Response(JSON.stringify({ routine: defaultRoutine, isDefault: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const routineText = data.choices[0].message.content;
    
    console.log('AI Routine response:', routineText);
    
    let routine;
    try {
      routine = JSON.parse(routineText);
      
      // Validate required fields exist
      if (!routine.morning_routine || !routine.evening_routine) {
        throw new Error('Invalid routine structure');
      }
    } catch (e) {
      console.error('Failed to parse AI response, using default routine:', e);
      routine = getDefaultRoutine(skinType);
    }

    return new Response(JSON.stringify({ routine }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-personalized-routine:', error);
    
    // Always return a default routine on error instead of failing
    const defaultRoutine = getDefaultRoutine('normal');
    return new Response(
      JSON.stringify({ routine: defaultRoutine, isDefault: true, error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 200, // Return 200 with default routine instead of 500
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
