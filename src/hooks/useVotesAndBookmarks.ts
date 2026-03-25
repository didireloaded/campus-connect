import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Post voting ────────────────────────────────────────────────
export function usePostVote(postId: string) {
  const { profile } = useAuth();
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    supabase
      .from('post_votes')
      .select('vote_type, user_id')
      .eq('post_id', postId)
      .then(({ data }) => {
        if (!data) return;
        const ups = data.filter((v: any) => v.vote_type === 'up').length;
        const downs = data.filter((v: any) => v.vote_type === 'down').length;
        setScore(ups - downs);
        const mine = data.find((v: any) => v.user_id === profile?.id);
        setMyVote(mine ? (mine.vote_type as 'up' | 'down') : null);
      });
  }, [postId, profile?.id]);

  const vote = async (type: 'up' | 'down') => {
    if (!profile?.id || loading) return;
    setLoading(true);
    try {
      if (myVote === type) {
        await supabase.from('post_votes').delete()
          .eq('post_id', postId).eq('user_id', profile.id);
        setMyVote(null);
        setScore(s => type === 'up' ? s - 1 : s + 1);
      } else {
        await supabase.from('post_votes').upsert(
          { post_id: postId, user_id: profile.id, vote_type: type },
          { onConflict: 'post_id,user_id' }
        );
        const delta = myVote ? (type === 'up' ? 2 : -2) : (type === 'up' ? 1 : -1);
        setScore(s => s + delta);
        setMyVote(type);
      }
    } finally {
      setLoading(false);
    }
  };

  return { score, myVote, vote };
}

// ── Comment voting ─────────────────────────────────────────────
export function useCommentVote(commentId: string) {
  const { profile } = useAuth();
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!commentId) return;
    supabase
      .from('comment_votes')
      .select('vote_type, user_id')
      .eq('comment_id', commentId)
      .then(({ data }) => {
        if (!data) return;
        const ups = data.filter((v: any) => v.vote_type === 'up').length;
        const downs = data.filter((v: any) => v.vote_type === 'down').length;
        setScore(ups - downs);
        const mine = data.find((v: any) => v.user_id === profile?.id);
        setMyVote(mine ? (mine.vote_type as 'up' | 'down') : null);
      });
  }, [commentId, profile?.id]);

  const vote = async (type: 'up' | 'down') => {
    if (!profile?.id) return;
    if (myVote === type) {
      await supabase.from('comment_votes').delete()
        .eq('comment_id', commentId).eq('user_id', profile.id);
      setMyVote(null);
      setScore(s => type === 'up' ? s - 1 : s + 1);
    } else {
      await supabase.from('comment_votes').upsert(
        { comment_id: commentId, user_id: profile.id, vote_type: type },
        { onConflict: 'comment_id,user_id' }
      );
      const delta = myVote ? (type === 'up' ? 2 : -2) : (type === 'up' ? 1 : -1);
      setScore(s => s + delta);
      setMyVote(type);
    }
  };

  return { score, myVote, vote };
}

// ── Bookmarks ──────────────────────────────────────────────────
export function useBookmark(postId: string) {
  const { profile } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id || !postId) return;
    supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setBookmarked(!!data));
  }, [postId, profile?.id]);

  const toggle = async () => {
    if (!profile?.id || loading) return;
    setLoading(true);
    try {
      if (bookmarked) {
        await supabase.from('bookmarks').delete()
          .eq('post_id', postId).eq('user_id', profile.id);
        setBookmarked(false);
      } else {
        await supabase.from('bookmarks').insert({ post_id: postId, user_id: profile.id });
        setBookmarked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return { bookmarked, toggle };
}

// ── All bookmarks for a user ───────────────────────────────────
export function useBookmarks() {
  const { profile } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('bookmarks')
      .select('*, post:posts(*, profile:profiles(username, full_name, avatar_url))')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookmarks(data || []);
        setLoading(false);
      });
  }, [profile?.id]);

  return { bookmarks, loading };
}
