
-- Lost & Found
CREATE TABLE public.lost_found (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  item_type text NOT NULL DEFAULT 'lost',
  location text,
  image_url text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lost_found ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lost found viewable by university" ON public.lost_found FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can create lost found" ON public.lost_found FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lost found" ON public.lost_found FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lost found" ON public.lost_found FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Rides
CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_time timestamptz NOT NULL,
  seats_available integer NOT NULL DEFAULT 1,
  price numeric DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rides viewable by university" ON public.rides FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can create rides" ON public.rides FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rides" ON public.rides FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rides" ON public.rides FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Study Groups
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  course text,
  description text,
  max_members integer DEFAULT 20,
  members_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups viewable by university" ON public.study_groups FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can create groups" ON public.study_groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update groups" ON public.study_groups FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete groups" ON public.study_groups FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

CREATE TABLE public.study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable" ON public.study_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join" ON public.study_group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON public.study_group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Lecture Notes
CREATE TABLE public.lecture_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  course text,
  description text,
  file_url text NOT NULL,
  file_type text,
  downloads_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes viewable by university" ON public.lecture_notes FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can upload notes" ON public.lecture_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.lecture_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Polls
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  votes_count integer DEFAULT 0,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable by university" ON public.polls FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can create polls" ON public.polls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own polls" ON public.polls FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable" ON public.poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Confessions
CREATE TABLE public.confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  alias text,
  reactions_count integer DEFAULT 0,
  moderation_status text DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '48 hours')
);
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Confessions viewable by university" ON public.confessions FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Anyone can confess" ON public.confessions FOR INSERT TO authenticated
  WITH CHECK (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));

-- Jobs
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  company text,
  description text,
  job_type text NOT NULL DEFAULT 'part-time',
  location text,
  pay text,
  contact_info text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs viewable by university" ON public.jobs FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can post jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (auth.uid() = poster_id);
CREATE POLICY "Users can delete own jobs" ON public.jobs FOR DELETE TO authenticated
  USING (auth.uid() = poster_id);

-- Clubs
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  category text,
  members_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clubs viewable by university" ON public.clubs FOR SELECT TO authenticated
  USING (university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can create clubs" ON public.clubs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update clubs" ON public.clubs FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete clubs" ON public.clubs FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

CREATE TABLE public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Club members viewable" ON public.club_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join clubs" ON public.club_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for lecture notes
INSERT INTO storage.buckets (id, name, public) VALUES ('lecture-notes', 'lecture-notes', true);

-- Storage policies for lecture-notes
CREATE POLICY "Anyone can read notes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lecture-notes');
CREATE POLICY "Users can upload notes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lecture-notes');
CREATE POLICY "Users can delete own notes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lecture-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
