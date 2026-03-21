import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DMThread {
  id: string;
  user_a: string;
  user_b: string;
  listing_id: string | null;
  created_at: string;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

export interface DirectMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  is_anonymous: boolean;
  sender_alias: string | null;
  read: boolean;
  created_at: string;
}

export const useDirectMessages = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("dm_threads")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Enrich with other user profile and last message
    const enriched: DMThread[] = [];
    for (const thread of data as any[]) {
      const otherId = thread.user_a === user.id ? thread.user_b : thread.user_a;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .eq("id", otherId)
        .single();

      const { data: lastMsg } = await supabase
        .from("direct_messages")
        .select("content, created_at")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", thread.id)
        .eq("read", false)
        .neq("sender_id", user.id);

      enriched.push({
        ...thread,
        other_user: profile || undefined,
        last_message: lastMsg?.content || undefined,
        unread_count: count || 0,
      });
    }

    setThreads(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchThreads();

    if (!user) return;
    const channel = supabase
      .channel("dm-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, () => fetchThreads())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads, user]);

  const getOrCreateThread = useCallback(async (otherUserId: string, listingId?: string) => {
    if (!user) return null;

    // Check existing
    const { data: existing } = await supabase
      .from("dm_threads")
      .select("id")
      .or(`and(user_a.eq.${user.id},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${user.id})`)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from("dm_threads")
      .insert({
        user_a: user.id,
        user_b: otherUserId,
        listing_id: listingId || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return created?.id || null;
  }, [user]);

  const sendMessage = useCallback(async (threadId: string, content: string, isAnonymous = false) => {
    if (!user) return;
    const { error } = await supabase.from("direct_messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      content,
      is_anonymous: isAnonymous,
      sender_alias: isAnonymous ? "Anonymous" : null,
    });
    if (error) throw error;
  }, [user]);

  const fetchMessages = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(200);

    // Mark as read
    if (user) {
      await supabase
        .from("direct_messages")
        .update({ read: true })
        .eq("thread_id", threadId)
        .neq("sender_id", user.id)
        .eq("read", false);
    }

    return (data || []) as DirectMessage[];
  }, [user]);

  return { threads, loading, fetchThreads, getOrCreateThread, sendMessage, fetchMessages };
};
