import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("Generating AI-powered product recommendations for user:", user.id);

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("skin_type, preferences")
      .eq("id", user.id)
      .single();

    // Get latest skin analysis
    const { data: latestAnalysis } = await supabaseClient
      .from("skin_analyses")
      .select("skin_type, detected_issues, recommendations, detailed_analysis")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get all 50 products
    const { data: products } = await supabaseClient
      .from("products")
      .select("*")
      .limit(50);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "No products available" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const skinType = latestAnalysis?.skin_type || profile?.skin_type || "normal";
    const concerns = latestAnalysis?.detected_issues || [];
    const analysisDetails = latestAnalysis?.detailed_analysis || "";

    console.log("User skin type:", skinType);
    console.log("User concerns:", concerns);

    // Prepare AI prompt
    const systemPrompt = `Anda adalah ahli dermatologi dan skincare yang berpengalaman. Tugas Anda adalah merekomendasikan produk skincare yang paling sesuai untuk user berdasarkan:
1. Tipe kulit user
2. Masalah kulit yang terdeteksi (skin concerns)
3. Ingredients yang cocok dan aman untuk tipe kulit tersebut
4. Rating dan kualitas produk

Analisis setiap produk berdasarkan:
- Kompatibilitas ingredients dengan tipe kulit
- Efektivitas untuk mengatasi concerns yang ada
- Keamanan ingredients (hindari produk dengan irritants atau allergens)
- Rating dan reputasi produk

Berikan rekomendasi dalam format JSON berikut:
{
  "recommendations": [
    {
      "product_id": "uuid",
      "reason": "Penjelasan singkat mengapa produk ini cocok (max 150 karakter)",
      "confidence_score": 0.0-5.0,
      "benefits": ["benefit1", "benefit2"],
      "key_ingredients": ["ingredient1", "ingredient2"]
    }
  ]
}

Rekomendasikan 6 produk terbaik, urutkan dari yang paling cocok.`;

    const userPrompt = `Tipe kulit: ${skinType}
Masalah kulit: ${concerns.length > 0 ? concerns.join(", ") : "Tidak ada masalah spesifik"}
Detail analisis kulit: ${analysisDetails}

Daftar produk yang tersedia (${products.length} produk):
${products.map((p, i) => `
${i + 1}. ID: ${p.id}
   Nama: ${p.name}
   Brand: ${p.brand}
   Kategori: ${p.category}
   Harga: Rp ${p.price.toLocaleString("id-ID")}
   Rating: ${p.rating || "N/A"}/5
   Deskripsi: ${p.description || "N/A"}
   Ingredients: ${p.ingredients || "N/A"}
   Benefits: ${p.benefits || "N/A"}
   Cocok untuk skin types: ${p.skin_types?.join(", ") || "Semua tipe"}
   Concerns: ${p.concerns?.join(", ") || "General"}
`).join("\n")}

Tolong rekomendasikan 6 produk terbaik untuk user ini dengan analisis mendalam.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI for product recommendations...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log("AI response received:", aiContent);

    const parsedRecommendations = JSON.parse(aiContent);

    if (!parsedRecommendations.recommendations || parsedRecommendations.recommendations.length === 0) {
      throw new Error("No recommendations generated by AI");
    }

    // Delete existing recommendations
    await supabaseClient
      .from("product_recommendations")
      .delete()
      .eq("user_id", user.id);

    // Insert new AI-powered recommendations
    const recommendationsToInsert = parsedRecommendations.recommendations.map((rec: any) => ({
      user_id: user.id,
      product_id: rec.product_id,
      reason: rec.reason,
      confidence_score: rec.confidence_score,
    }));

    const { error: insertError } = await supabaseClient
      .from("product_recommendations")
      .insert(recommendationsToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(`Successfully generated ${recommendationsToInsert.length} AI-powered recommendations`);

    return new Response(
      JSON.stringify({
        success: true,
        count: recommendationsToInsert.length,
        recommendations: parsedRecommendations.recommendations,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
