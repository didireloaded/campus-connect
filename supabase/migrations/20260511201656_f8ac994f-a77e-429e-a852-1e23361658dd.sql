-- Tighten stories RLS: require university_id match for both SELECT and INSERT
DROP POLICY IF EXISTS "Stories viewable by university members" ON public.stories;
DROP POLICY IF EXISTS "Users can create stories" ON public.stories;

CREATE POLICY "Stories viewable by own university"
ON public.stories
FOR SELECT
TO authenticated
USING (
  university_id IS NOT NULL
  AND university_id = public.get_my_university_id()
);

CREATE POLICY "Users can create stories in own university"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND university_id IS NOT NULL
  AND university_id = public.get_my_university_id()
);