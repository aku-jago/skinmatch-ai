import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive system prompt based on user profile
    let systemPrompt = `Anda adalah konsultan skincare AI yang ramah dan profesional.

ATURAN FORMAT (WAJIB DIIKUTI):
- Jawab dalam Bahasa Indonesia
- Maksimal 150 kata per respons
- Gunakan poin-poin singkat, BUKAN paragraf panjang
- Setiap poin maksimal 1-2 kalimat

FORMAT RESPONS:
[Salam singkat 1 kalimat]

• [Poin utama 1]
• [Poin utama 2]
• [Poin utama 3]

[Jika ada langkah-langkah:]
1. [Langkah 1 - singkat]
2. [Langkah 2 - singkat]
3. [Langkah 3 - singkat]

[Penutup 1 kalimat]

PROFIL USER:`;

    if (userProfile?.skin_type) {
      systemPrompt += `\n• Tipe Kulit: ${userProfile.skin_type}`;
    }
    if (userProfile?.gender) {
      systemPrompt += `\n• Gender: ${userProfile.gender}`;
    }
    if (userProfile?.age) {
      systemPrompt += `\n• Usia: ${userProfile.age}`;
    }

    systemPrompt += `

PANDUAN:
- Sesuaikan saran dengan tipe kulit user
- Fokus pada bahan aktif, bukan merek
- Untuk routine, pisahkan pagi dan malam
- Ingatkan patch test untuk produk baru
- Sarankan ke dermatologist untuk masalah serius`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment." 
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI service requires payment. Please contact support." 
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});