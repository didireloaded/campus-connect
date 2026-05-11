import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  bg_color: string;
  duration_hours: number;
  expires_at: string;
  view_count: number;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  viewed: boolean;
}

export interface StoryGroup {
  user_id: string;
  profile: Story['profile'];
  stories: Story[];
  hasUnviewed: boolean;
}

export function useStories() {
  const { profile } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:profiles!stories_user_id_fkey(id, username, full_name, avatar_url),
          story_views(viewer_id)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = new Map<string, StoryGroup>();
      for (const s of ((data as any[]) || [])) {
        const viewed = (s.story_views || []).some((v: any) => v.viewer_id === profile.id);
        const story: Story = { ...s, viewed, story_views: undefined };
        if (!grouped.has(s.user_id)) {
          grouped.set(s.user_id, {
            user_id: s.user_id,
            profile: s.profile,
            stories: [],
            hasUnviewed: false,
          });
        }
        const g = grouped.get(s.user_id)!;
        g.stories.push(story);
        if (!viewed) g.hasUnviewed = true;
      }

      const groups = Array.from(grouped.values());
      groups.sort((a, b) => {
        if (a.user_id === profile.id) return -1;
        if (b.user_id === profile.id) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setStoryGroups(groups);
    } catch (err) {
      console.error('fetchStories error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const markViewed = async (storyId: string) => {
    if (!profile?.id) return;
    try {
      await supabase.from('story_views').upsert(
        { story_id: storyId, viewer_id: profile.id },
        { onConflict: 'story_id,viewer_id' }
      );
      setStoryGroups(prev =>
        prev.map(g => ({
          ...g,
          stories: g.stories.map(s => s.id === storyId ? { ...s, viewed: true } : s),
          hasUnviewed: g.stories.some(s => s.id !== storyId && !s.viewed),
        }))
      );
    } catch (err) {
      console.error('markViewed error:', err);
    }
  };

  const uploadStory = async (
    file: File,
    caption: string,
    durationHours: number,
    bgColor: string
  ) => {
    if (!profile?.id) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('stories')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    // Get user's university_id from profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', profile.id)
      .single();

    if (!userProfile?.university_id) {
      throw new Error('Join a campus before posting a story.');
    }

    const { error } = await supabase.from('stories').insert({
      user_id: profile.id,
      university_id: userProfile.university_id,
      media_url: publicUrl,
      media_type: file.type.startsWith('video') ? 'video' : 'image',
      caption: caption || null,
      bg_color: bgColor,
      duration_hours: durationHours,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;
    toast.success('Story posted!');
    await fetchStories();
  };

  const deleteStory = async (storyId: string) => {
    const { error } = await supabase.from('stories').delete().eq('id', storyId);
    if (error) throw error;
    await fetchStories();
  };

  return { storyGroups, loading, uploadStory, deleteStory, markViewed, refresh: fetchStories };
}
