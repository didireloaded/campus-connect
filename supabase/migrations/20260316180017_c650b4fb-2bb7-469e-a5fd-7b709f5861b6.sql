
-- User roles table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can see all roles, users can see their own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trending topics table
CREATE TABLE public.trending_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  post_count integer DEFAULT 0,
  detected_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trending viewable by university" ON public.trending_topics
  FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "System can manage trending" ON public.trending_topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add moderation columns to posts and wall_posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_reason text;
ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';
ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS moderation_reason text;

-- Feed ranking function
CREATE OR REPLACE FUNCTION public.get_ranked_feed(p_university_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  university_id uuid,
  content text,
  image_url text,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  score double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
      COALESCE(p.likes_count, 0) * 2.0 +
      COALESCE(p.comments_count, 0) * 3.0 +
      CASE
        WHEN p.created_at > now() - interval '1 hour' THEN 50
        WHEN p.created_at > now() - interval '6 hours' THEN 30
        WHEN p.created_at > now() - interval '24 hours' THEN 15
        ELSE 0
      END
    ) AS score
  FROM public.posts p
  WHERE p.university_id = p_university_id
    AND p.moderation_status = 'approved'
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset
$$;

-- Enable realtime for trending_topics
ALTER PUBLICATION supabase_realtime ADD TABLE public.trending_topics;
