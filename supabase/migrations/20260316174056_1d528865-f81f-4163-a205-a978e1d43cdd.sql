
-- Marketplace listings table
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES public.universities(id),
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  category text NOT NULL DEFAULT 'other',
  image_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings viewable by university members" ON public.marketplace_listings
FOR SELECT USING (
  university_id = (SELECT profiles.university_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Users can create listings" ON public.marketplace_listings
FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their listings" ON public.marketplace_listings
FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their listings" ON public.marketplace_listings
FOR DELETE USING (auth.uid() = seller_id);

CREATE INDEX marketplace_university_idx ON public.marketplace_listings(university_id);
CREATE INDEX marketplace_category_idx ON public.marketplace_listings(category);

ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
