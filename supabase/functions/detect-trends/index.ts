import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all universities
    const { data: universities } = await supabase.from("universities").select("id, short_name, name");
    if (!universities) throw new Error("No universities found");

    const results: any[] = [];

    for (const uni of universities) {
      // Get wall posts from last 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: wallPosts } = await supabase
        .from("wall_posts")
        .select("content")
        .eq("university_id", uni.id)
        .gte("created_at", sixHoursAgo);

      if (!wallPosts || wallPosts.length < 3) continue;

      const postsText = wallPosts.map((p) => p.content).join("\n---\n");

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
              content: `You analyze anonymous campus wall posts to detect trending topics. Given a set of posts from a university campus, identify 1-3 trending topics that multiple students are discussing. Only return topics mentioned by at least 2 different posts.`
            },
            {
              role: "user",
              content: `Here are recent anonymous posts from ${uni.short_name || uni.name}:\n\n${postsText}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_trends",
              description: "Report trending topics found in campus wall posts",
              parameters: {
                type: "object",
                properties: {
                  topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string", description: "Short topic summary e.g. 'Exam stress'" },
                        post_count: { type: "integer", description: "Number of posts about this topic" }
                      },
                      required: ["topic", "post_count"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["topics"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "report_trends" } }
        }),
      });

      if (!response.ok) {
        console.error(`Trending detection failed for ${uni.short_name}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      try {
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const { topics } = JSON.parse(toolCall.function.arguments);
          
          // Clear old trending for this university
          await supabase.from("trending_topics").delete().eq("university_id", uni.id);

          if (topics && topics.length > 0) {
            const inserts = topics.map((t: any) => ({
              university_id: uni.id,
              topic: t.topic,
              post_count: t.post_count,
            }));
            await supabase.from("trending_topics").insert(inserts);
            results.push({ university: uni.short_name, topics });
          }
        }
      } catch {
        console.error("Failed to parse trending result for", uni.short_name);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Trending error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
