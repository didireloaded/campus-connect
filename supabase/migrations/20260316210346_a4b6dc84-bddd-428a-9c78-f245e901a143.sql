CREATE OR REPLACE FUNCTION public.check_confession_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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