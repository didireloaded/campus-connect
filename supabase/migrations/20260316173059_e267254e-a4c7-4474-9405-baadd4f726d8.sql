
-- 1. Universities: add short_name, city, country
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS short_name text;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS country text DEFAULT 'Namibia';

-- Update existing university data with short names
UPDATE public.universities SET short_name = 'UNAM', city = 'Windhoek' WHERE name ILIKE '%University of Namibia%';
UPDATE public.universities SET short_name = 'NUST', city = 'Windhoek' WHERE name ILIKE '%Science and Technology%';
UPDATE public.universities SET short_name = 'IUM', city = 'Windhoek' WHERE name ILIKE '%International University%';
UPDATE public.universities SET short_name = 'Welwitchia', city = 'Windhoek' WHERE name ILIKE '%Welwitchia%';

-- 2. Wall posts: add alias for anonymous identity
ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS alias text;

-- 3. Notifications: replace post_id/event_id with generic reference_id
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id uuid;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS post_id;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS event_id;

-- 4. Reports: replace post_id/wall_post_id with content_type/content_id
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content_id uuid;
ALTER TABLE public.reports DROP COLUMN IF EXISTS post_id;
ALTER TABLE public.reports DROP COLUMN IF EXISTS wall_post_id;

-- 5. Indexes for fast campus-scoped queries
CREATE INDEX IF NOT EXISTS posts_university_idx ON public.posts(university_id);
CREATE INDEX IF NOT EXISTS wall_posts_university_idx ON public.wall_posts(university_id);
CREATE INDEX IF NOT EXISTS events_university_idx ON public.events(university_id);
CREATE INDEX IF NOT EXISTS stories_university_idx ON public.stories(university_id);

-- 6. Enable pg_cron and schedule 24h cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.schedule(
  'cleanup-wall-posts',
  '0 * * * *',
  $$DELETE FROM public.wall_posts WHERE created_at < now() - interval '24 hours'$$
);

SELECT cron.schedule(
  'cleanup-stories',
  '0 * * * *',
  $$DELETE FROM public.stories WHERE created_at < now() - interval '24 hours'$$
);
