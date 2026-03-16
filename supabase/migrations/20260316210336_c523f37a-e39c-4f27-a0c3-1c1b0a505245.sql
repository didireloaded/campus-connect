-- Helper function: returns true if the calling user has role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- reports: only admins can read pending reports (drop old policy first)
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admin can read reports" ON public.reports;
CREATE POLICY "Admin can read reports"
  ON public.reports
  FOR SELECT
  USING (public.is_admin() OR auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Allow admins to update reports (resolve them)
DROP POLICY IF EXISTS "Admin can update reports" ON public.reports;
CREATE POLICY "Admin can update reports"
  ON public.reports
  FOR UPDATE
  USING (public.is_admin());

-- posts: admins can update moderation fields
DROP POLICY IF EXISTS "Admin can update moderation status" ON public.posts;
CREATE POLICY "Admin can update moderation status"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Confession rate-limit trigger
CREATE OR REPLACE FUNCTION public.check_confession_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM confessions
  WHERE university_id = NEW.university_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit: too many confessions per hour';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS confession_rate_limit ON public.confessions;
CREATE TRIGGER confession_rate_limit
  BEFORE INSERT ON public.confessions
  FOR EACH ROW EXECUTE FUNCTION public.check_confession_rate_limit();