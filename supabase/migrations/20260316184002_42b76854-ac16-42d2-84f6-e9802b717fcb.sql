
-- Wall comments table for threaded replies
CREATE TABLE public.wall_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_post_id uuid REFERENCES public.wall_posts(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES public.wall_comments(id) ON DELETE CASCADE,
  alias text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.wall_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wall comments viewable by university" ON public.wall_comments FOR SELECT TO authenticated
  USING (wall_post_id IN (
    SELECT id FROM wall_posts WHERE university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid())
  ));
CREATE POLICY "Authenticated users can comment" ON public.wall_comments FOR INSERT TO authenticated
  WITH CHECK (true);

-- Wall downvotes
CREATE TABLE public.wall_downvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_post_id uuid REFERENCES public.wall_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wall_post_id, user_id)
);
ALTER TABLE public.wall_downvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Downvotes viewable" ON public.wall_downvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can downvote" ON public.wall_downvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove downvote" ON public.wall_downvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add downvotes count to wall_posts
ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS downvotes integer DEFAULT 0;
ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Add view_count to stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
