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
    let systemPrompt = `You are a professional, empathetic skincare consultant AI assistant. Your responses should be:
- Well-structured with clear paragraphs
- Use numbered lists for step-by-step advice
- Use bullet points (•) for multiple items
- Friendly and supportive in tone
- Evidence-based and practical

USER PROFILE:`;

    if (userProfile?.skin_type) {
      systemPrompt += `\n• Skin Type: ${userProfile.skin_type}`;
    }
    if (userProfile?.gender) {
      systemPrompt += `\n• Gender: ${userProfile.gender}`;
    }
    if (userProfile?.age) {
      systemPrompt += `\n• Age: ${userProfile.age}`;
    }

    systemPrompt += `

GUIDELINES:
1. Always tailor advice to the user's ${userProfile?.skin_type || 'specific'} skin type
2. When suggesting products, focus on key ingredients rather than specific brands
3. Format responses with clear sections and spacing
4. For routines, provide morning and evening steps
5. Include practical tips that are easy to follow
6. Remind users to patch test new products
7. Suggest consulting a dermatologist for serious concerns

Keep responses concise but comprehensive. Use this format for better readability:

Short greeting or acknowledgment.

Main advice with clear structure:
• Point one
• Point two
• Point three

Specific recommendations:
1. First step
2. Second step
3. Third step

Closing encouragement or note.`;

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