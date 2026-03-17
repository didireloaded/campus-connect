
-- Marketplace enhancements
ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT[],
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Rides enhancements
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'driver',
  ADD COLUMN IF NOT EXISTS vehicle_desc TEXT,
  ADD COLUMN IF NOT EXISTS departure_window_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS from_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_lng DOUBLE PRECISION;

-- Lecture notes enhancements
ALTER TABLE lecture_notes
  ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;

-- Lecture note upvotes table
CREATE TABLE IF NOT EXISTS lecture_note_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES lecture_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(note_id, user_id)
);
ALTER TABLE lecture_note_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Upvotes viewable" ON lecture_note_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upvote notes" ON lecture_note_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove note upvote" ON lecture_note_upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Spotted posts
CREATE TABLE IF NOT EXISTS spotted_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_id UUID NOT NULL REFERENCES universities(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  spotted_time TEXT,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  alias TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE spotted_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Spotted viewable by university" ON spotted_posts FOR SELECT TO authenticated
  USING (university_id = (SELECT university_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create spotted" ON spotted_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own spotted" ON spotted_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Spotted reactions
CREATE TABLE IF NOT EXISTS spotted_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES spotted_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE spotted_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Spotted reactions viewable" ON spotted_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add spotted reaction" ON spotted_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove spotted reaction" ON spotted_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Study group messages
CREATE TABLE IF NOT EXISTS study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE study_group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group messages" ON study_group_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_group_messages.group_id AND user_id = auth.uid()));
CREATE POLICY "Members can send group messages" ON study_group_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_group_messages.group_id AND user_id = auth.uid()));

-- Study group announcements
CREATE TABLE IF NOT EXISTS study_group_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE study_group_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group announcements" ON study_group_announcements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_group_announcements.group_id AND user_id = auth.uid()));
CREATE POLICY "Authors can create group announcements" ON study_group_announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update group announcements" ON study_group_announcements FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete group announcements" ON study_group_announcements FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Enable realtime for study group messages
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_messages;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-images', 'marketplace-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('spotted-images', 'spotted-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('lost-found-images', 'lost-found-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('study-group-files', 'study-group-files', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS for all new buckets
CREATE POLICY "Authenticated users can upload marketplace images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marketplace-images');
CREATE POLICY "Anyone can view marketplace images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'marketplace-images');
CREATE POLICY "Authenticated users can upload spotted images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'spotted-images');
CREATE POLICY "Anyone can view spotted images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'spotted-images');
CREATE POLICY "Authenticated users can upload lost-found images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lost-found-images');
CREATE POLICY "Anyone can view lost-found images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'lost-found-images');
CREATE POLICY "Authenticated users can upload study-group files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study-group-files');
CREATE POLICY "Anyone can view study-group files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'study-group-files');
