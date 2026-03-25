
-- Add missing columns to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#111111';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS duration_hours integer NOT NULL DEFAULT 24;

-- Story views table
CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Post votes (upvote/downvote)
CREATE TABLE IF NOT EXISTS public.post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL DEFAULT 'up',
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Validation trigger for post_votes vote_type
CREATE OR REPLACE FUNCTION public.validate_post_vote_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.vote_type NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'vote_type must be up or down';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_post_vote_type
  BEFORE INSERT OR UPDATE ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_post_vote_type();

-- Comment votes
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL DEFAULT 'up',
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE TRIGGER trg_validate_comment_vote_type
  BEFORE INSERT OR UPDATE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_post_vote_type();

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS post_votes_post_id_idx ON public.post_votes(post_id);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS messages_conv_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Validation trigger for stories media_type
CREATE OR REPLACE FUNCTION public.validate_story_media_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.media_type NOT IN ('image', 'video') THEN
    RAISE EXCEPTION 'media_type must be image or video';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_story_media_type
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.validate_story_media_type();

-- RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- story_views policies
CREATE POLICY "story_views_select" ON public.story_views FOR SELECT USING (true);
CREATE POLICY "story_views_insert" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- post_votes policies
CREATE POLICY "post_votes_select" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "post_votes_insert" ON public.post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_votes_update" ON public.post_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "post_votes_delete" ON public.post_votes FOR DELETE USING (auth.uid() = user_id);

-- comment_votes policies
CREATE POLICY "comment_votes_select" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "comment_votes_insert" ON public.comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_votes_delete" ON public.comment_votes FOR DELETE USING (auth.uid() = user_id);

-- bookmarks policies
CREATE POLICY "bookmarks_select" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- conversations policies
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- messages policies
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Cleanup function for expired stories
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.stories WHERE expires_at < now();
$$;
