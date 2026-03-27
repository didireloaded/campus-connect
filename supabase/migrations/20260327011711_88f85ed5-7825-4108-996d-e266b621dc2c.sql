
-- Counter triggers for production functionality

-- 1. Update likes_count on post
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE PROCEDURE update_post_likes_count();

-- 2. Update comments_count on post
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_post_comments_count();

-- 3. Update event attendees_count
CREATE OR REPLACE FUNCTION update_event_attendees_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE events SET attendees_count = COALESCE(attendees_count, 0) + 1 WHERE id = NEW.event_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE events SET attendees_count = GREATEST(COALESCE(attendees_count, 0) - 1, 0) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_event_attendee_change
  AFTER INSERT OR DELETE ON event_attendees
  FOR EACH ROW EXECUTE PROCEDURE update_event_attendees_count();

-- 4. Update wall post upvotes
CREATE OR REPLACE FUNCTION update_wall_upvotes()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE wall_posts SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = NEW.wall_post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE wall_posts SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) WHERE id = OLD.wall_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_wall_upvote_change
  AFTER INSERT OR DELETE ON wall_upvotes
  FOR EACH ROW EXECUTE PROCEDURE update_wall_upvotes();

-- 5. Update wall post downvotes
CREATE OR REPLACE FUNCTION update_wall_downvotes()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE wall_posts SET downvotes = COALESCE(downvotes, 0) + 1 WHERE id = NEW.wall_post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE wall_posts SET downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0) WHERE id = OLD.wall_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_wall_downvote_change
  AFTER INSERT OR DELETE ON wall_downvotes
  FOR EACH ROW EXECUTE PROCEDURE update_wall_downvotes();

-- 6. Update wall post comments_count
CREATE OR REPLACE FUNCTION update_wall_comments_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE wall_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.wall_post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE wall_posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.wall_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_wall_comment_change
  AFTER INSERT OR DELETE ON wall_comments
  FOR EACH ROW EXECUTE PROCEDURE update_wall_comments_count();

-- 7. Update followers/following counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_follower_change
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW EXECUTE PROCEDURE update_follower_counts();

-- 8. Update club members_count
CREATE OR REPLACE FUNCTION update_club_members_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE clubs SET members_count = COALESCE(members_count, 0) + 1 WHERE id = NEW.club_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE clubs SET members_count = GREATEST(COALESCE(members_count, 0) - 1, 0) WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_club_member_change
  AFTER INSERT OR DELETE ON club_members
  FOR EACH ROW EXECUTE PROCEDURE update_club_members_count();

-- 9. Update study group members_count
CREATE OR REPLACE FUNCTION update_study_group_members_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE study_groups SET members_count = COALESCE(members_count, 0) + 1 WHERE id = NEW.group_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE study_groups SET members_count = GREATEST(COALESCE(members_count, 0) - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_study_group_member_change
  AFTER INSERT OR DELETE ON study_group_members
  FOR EACH ROW EXECUTE PROCEDURE update_study_group_members_count();

-- 10. Update conversations.last_message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.content, last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE update_conversation_last_message();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_university ON posts(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_university ON events(university_id, event_date);
CREATE INDEX IF NOT EXISTS idx_wall_posts_university ON wall_posts(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_confessions_university ON confessions(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_spotted_university ON spotted_posts(university_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_university ON marketplace_listings(university_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_groups_university ON study_groups(university_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_threads_users ON dm_threads(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_campus_updates_uni ON campus_updates(university_id, created_at DESC);

-- Enable realtime for key tables
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.likes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.comments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.polls; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_threads; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.events; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.spotted_posts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.lost_found; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rides; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_alerts; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
