import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message?: string;
  last_message_at: string;
  other_profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  read_at?: string;
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function useConversations() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profile1:profiles!conversations_participant_1_fkey(id, username, full_name, avatar_url),
        profile2:profiles!conversations_participant_2_fkey(id, username, full_name, avatar_url)
      `)
      .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
      .order('last_message_at', { ascending: false });

    if (error) { console.error(error); return; }

    const convs: Conversation[] = ((data as any[]) || []).map((c: any) => {
      const other = c.participant_1 === profile.id ? c.profile2 : c.profile1;
      return {
        id: c.id,
        participant_1: c.participant_1,
        participant_2: c.participant_2,
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        other_profile: other,
        unread_count: 0,
      };
    });

    // Count unread per conversation
    await Promise.all(convs.map(async (c) => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .neq('sender_id', profile.id)
        .is('read_at', null);
      c.unread_count = count || 0;
    }));

    setConversations(convs);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchConversations();

    if (!profile?.id) return;
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `participant_1=eq.${profile.id}`,
      }, fetchConversations)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `participant_2=eq.${profile.id}`,
      }, fetchConversations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations, profile?.id]);

  const getOrCreateConversation = async (otherUserId: string): Promise<string> => {
    if (!profile?.id) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1.eq.${profile.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${profile.id})`
      )
      .maybeSingle();

    if (existing) return existing.id;

    const p1 = profile.id < otherUserId ? profile.id : otherUserId;
    const p2 = profile.id < otherUserId ? otherUserId : profile.id;

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ participant_1: p1, participant_2: p2 })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
  };

  return { conversations, loading, refresh: fetchConversations, getOrCreateConversation };
}

export function useMessages(conversationId: string) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const { data } = await supabase
      .from('messages')
      .select(`*, sender:profiles!messages_sender_id_fkey(username, full_name, avatar_url)`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages((data as any[] || []) as Message[]);
    setLoading(false);

    if (profile?.id) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', profile.id)
        .is('read_at', null);
    }
  }, [conversationId, profile?.id]);

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', (payload.new as any).sender_id)
          .single();
        setMessages(prev => [...prev, { ...(payload.new as Message), sender: sender as any }]);

        if (profile?.id && (payload.new as any).sender_id !== profile.id) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', (payload.new as any).id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages, conversationId, profile?.id]);

  const sendMessage = async (content: string, mediaUrl?: string) => {
    if (!profile?.id || !conversationId) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content,
      media_url: mediaUrl || null,
    });

    if (error) throw error;

    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);
  };

  return { messages, loading, sendMessage, refresh: fetchMessages };
}
