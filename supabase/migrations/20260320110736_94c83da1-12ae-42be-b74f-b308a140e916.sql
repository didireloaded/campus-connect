
-- ============================================================
-- Phase 1: Add missing columns to existing tables
-- ============================================================

-- profiles: add extended fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS major TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_year TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_updates_seen_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS peek_university_id UUID REFERENCES universities(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shadow_reduced BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shadow_reduced_at TIMESTAMPTZ;

-- universities: add campus coordinates
ALTER TABLE universities ADD COLUMN IF NOT EXISTS campus_lat NUMERIC;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS campus_lng NUMERIC;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS email_domain TEXT;

-- events: add end_date & verification_level
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'student';

-- confessions: add user_id for moderation tracking
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- wall_posts: add user_id & expires_at
ALTER TABLE wall_posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE wall_posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours');

-- spotted_posts: add moderation_status & expires_at
ALTER TABLE spotted_posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE spotted_posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '48 hours');

-- marketplace_listings: add moderation_status
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';

-- lost_found: add image_urls array, has_sensitive, resolved fields
ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS has_sensitive BOOLEAN DEFAULT false;
ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- comments: add parent_comment_id for threading
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id);

-- study_groups: add inline announcement fields
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS announcement_title TEXT;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS announcement_body TEXT;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS announcement_by UUID REFERENCES profiles(id);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS announcement_at TIMESTAMPTZ;

-- study_group_members: add role & last_read_at
ALTER TABLE study_group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE study_group_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT now();

-- study_group_messages: add file_size
ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- lecture_notes: add enhanced categorization fields
ALTER TABLE lecture_notes ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE lecture_notes ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE lecture_notes ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE lecture_notes ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE lecture_notes ADD COLUMN IF NOT EXISTS ai_tagged BOOLEAN DEFAULT false;

-- jobs: add expires_at
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ============================================================
-- Phase 2: Create new tables
-- ============================================================

-- daily_aliases (anonymous identity consistency)
CREATE TABLE IF NOT EXISTS daily_aliases (
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  alias_date   DATE NOT NULL,
  alias        TEXT NOT NULL,
  PRIMARY KEY (user_id, content_type, alias_date)
);
ALTER TABLE daily_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own aliases" ON daily_aliases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saved_posts (bookmarks for any content type)
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL,
  post_type  TEXT NOT NULL,
  saved_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saves" ON saved_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- event_checkins
CREATE TABLE IF NOT EXISTS event_checkins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View event checkins" ON event_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can check in" ON event_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- event_bookmarks
CREATE TABLE IF NOT EXISTS event_bookmarks (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage event bookmarks" ON event_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- event_messages (live chat at events)
CREATE TABLE IF NOT EXISTS event_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View event messages" ON event_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Send event messages" ON event_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- spotted_comments
CREATE TABLE IF NOT EXISTS spotted_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID REFERENCES spotted_posts(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES profiles(id) NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  alias        TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE spotted_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View spotted comments" ON spotted_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create spotted comments" ON spotted_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own spotted comments" ON spotted_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- marketplace_messages (buyer-seller DMs)
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  sender_id   UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own marketplace messages" ON marketplace_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Send marketplace messages" ON marketplace_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Update own marketplace messages" ON marketplace_messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- study_group_files
CREATE TABLE IF NOT EXISTS study_group_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  uploader_id UUID REFERENCES profiles(id) NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_size   INTEGER,
  file_type   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE study_group_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view group files" ON study_group_files FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_group_files.group_id AND user_id = auth.uid())
);
CREATE POLICY "Members upload group files" ON study_group_files FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = uploader_id AND EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_group_files.group_id AND user_id = auth.uid())
);

-- lecture_note_bookmarks
CREATE TABLE IF NOT EXISTS lecture_note_bookmarks (
  note_id    UUID REFERENCES lecture_notes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);
ALTER TABLE lecture_note_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage note bookmarks" ON lecture_note_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- campus_updates (official university news)
CREATE TABLE IF NOT EXISTS campus_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT,
  source        TEXT,
  source_type   TEXT,
  source_url    TEXT UNIQUE,
  image_url     TEXT,
  created_at    TIMESTAMPTZ,
  inserted_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE campus_updates ENABLE ROW LEVEL SECURITY;

-- campus_alerts
CREATE TABLE IF NOT EXISTS campus_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  severity      TEXT DEFAULT 'info',
  posted_by     UUID REFERENCES profiles(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE campus_alerts ENABLE ROW LEVEL SECURITY;

-- dm_threads
CREATE TABLE IF NOT EXISTS dm_threads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own DM threads" ON dm_threads FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Create DM threads" ON dm_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- direct_messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID REFERENCES dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id    UUID REFERENCES profiles(id) NOT NULL,
  content      TEXT NOT NULL,
  sender_alias TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  read         BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own DMs" ON direct_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM dm_threads WHERE id = direct_messages.thread_id AND (user_a = auth.uid() OR user_b = auth.uid()))
);
CREATE POLICY "Send DMs" ON direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Update DM read status" ON direct_messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM dm_threads WHERE id = direct_messages.thread_id AND (user_a = auth.uid() OR user_b = auth.uid()))
);

-- feature_flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  enabled     BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feature flags readable" ON feature_flags FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Phase 3: RLS for campus_updates & campus_alerts
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_university_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT university_id FROM profiles WHERE id = auth.uid()
$$;

CREATE POLICY "View campus updates for own university" ON campus_updates FOR SELECT TO authenticated USING (university_id = public.get_my_university_id());
CREATE POLICY "View campus alerts for own university" ON campus_alerts FOR SELECT TO authenticated USING (university_id = public.get_my_university_id());

-- ============================================================
-- Phase 4: SQL Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_trending_score(
  p_likes     INT,
  p_comments  INT,
  p_joins     INT,
  p_views     INT,
  p_created_at TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  engagement NUMERIC;
  hours_since NUMERIC;
BEGIN
  engagement :=
    p_likes
    + (p_comments * 2)
    + (p_joins    * 3)
    + (p_views    * 0.5);
  hours_since := EXTRACT(EPOCH FROM (now() - p_created_at)) / 3600;
  RETURN engagement / (hours_since + 2);
END;
$$;

-- Updated ranked feed with better scoring
DROP FUNCTION IF EXISTS public.get_ranked_feed(UUID, INT, INT);
CREATE OR REPLACE FUNCTION public.get_ranked_feed(
  p_university_id UUID,
  p_limit INT DEFAULT 30,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  university_id UUID,
  content TEXT,
  image_url TEXT,
  likes_count INT,
  comments_count INT,
  created_at TIMESTAMPTZ,
  score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    p.id,
    p.user_id,
    p.university_id,
    p.content,
    p.image_url,
    p.likes_count,
    p.comments_count,
    p.created_at,
    (
      0.4 * (1.0 / (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 + 1))
      + 0.3 * (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0)
      + CASE
          WHEN p.created_at > now() - interval '1 hour' THEN 0.5
          WHEN p.created_at > now() - interval '6 hours' THEN 0.3
          ELSE 0
        END
    )::DOUBLE PRECISION AS score
  FROM posts p
  WHERE p.university_id = p_university_id
    AND p.moderation_status != 'removed'
    AND p.created_at > now() - interval '72 hours'
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset
$$;

-- ============================================================
-- Phase 5: Performance Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_posts_uni_created ON posts(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_uni_date ON events(university_id, event_date);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_uni_expires ON stories(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_confessions_uni_expires ON confessions(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_wall_posts_uni_expires ON wall_posts(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_spotted_uni_expires ON spotted_posts(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_uni_status ON marketplace_listings(university_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_listings(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_sg_messages_group ON study_group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lecture_notes_uni_upvotes ON lecture_notes(university_id, upvotes_count DESC);
CREATE INDEX IF NOT EXISTS idx_lecture_notes_user ON lecture_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_uni_status ON jobs(university_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campus_updates_uni ON campus_updates(university_id, created_at DESC);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spotted_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_alerts;
