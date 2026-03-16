
-- Fix the permissive INSERT policy for wall_comments
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.wall_comments;
CREATE POLICY "Users can comment on campus wall" ON public.wall_comments FOR INSERT TO authenticated
  WITH CHECK (wall_post_id IN (
    SELECT id FROM wall_posts WHERE university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid())
  ));
