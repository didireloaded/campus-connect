import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, content_type, content_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a content moderation AI for a university campus social app. Analyze the following post and determine if it violates community guidelines.

Check for:
- Hate speech or discrimination
- Harassment or bullying
- Explicit/sexual content
- Spam or advertising
- Threats of violence
- Doxxing or sharing personal information

Respond with a JSON object: {"safe": true/false, "reason": "brief explanation if unsafe", "severity": "low/medium/high"}
Only respond with the JSON, nothing else.`
          },
          { role: "user", content: content }
        ],
        tools: [{
          type: "function",
          function: {
            name: "moderate_content",
            description: "Return moderation result for the content",
            parameters: {
              type: "object",
              properties: {
                safe: { type: "boolean" },
                reason: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] }
              },
              required: ["safe", "reason", "severity"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "moderate_content" } }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let result = { safe: true, reason: "", severity: "low" };

    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      }
    } catch {
      console.error("Failed to parse moderation result");
    }

    // Update content moderation status
    if (!result.safe) {
      const table = content_type === "wall_post" ? "wall_posts" : "posts";
      await supabase.from(table).update({
        moderation_status: result.severity === "high" ? "removed" : "flagged",
        moderation_reason: result.reason,
      }).eq("id", content_id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
