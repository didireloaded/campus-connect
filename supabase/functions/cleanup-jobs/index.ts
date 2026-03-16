import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Delete expired wall posts (24h)
    const { data: deletedWall, error: wallErr } = await supabase
      .from("wall_posts")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select("id");

    // 2. Delete expired stories (24h)
    const { data: deletedStories, error: storyErr } = await supabase
      .from("stories")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");

    // 3. Delete expired trending topics
    const { data: deletedTrending } = await supabase
      .from("trending_topics")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");

    // 4. Send event reminders (events starting within 1 hour)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: upcomingEvents } = await supabase
      .from("events")
      .select("id, title, event_date, creator_id")
      .gte("event_date", now)
      .lte("event_date", oneHourFromNow);

    if (upcomingEvents && upcomingEvents.length > 0) {
      for (const event of upcomingEvents) {
        // Get attendees
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id")
          .eq("event_id", event.id);

        if (attendees) {
          const notifications = attendees.map((a) => ({
            user_id: a.user_id,
            type: "event_reminder",
            reference_id: event.id,
            actor_id: event.creator_id,
          }));

          if (notifications.length > 0) {
            await supabase.from("notifications").insert(notifications);
          }
        }
      }
    }

    const result = {
      wall_posts_deleted: deletedWall?.length || 0,
      stories_deleted: deletedStories?.length || 0,
      trending_expired: deletedTrending?.length || 0,
      event_reminders_sent: upcomingEvents?.length || 0,
    };

    console.log("Cleanup results:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Cleanup error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
