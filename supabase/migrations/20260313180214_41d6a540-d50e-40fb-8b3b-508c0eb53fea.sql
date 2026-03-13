
-- Company info (one per profile)
CREATE TABLE public.company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to company_info" ON public.company_info FOR ALL TO public USING (true) WITH CHECK (true);

-- Company material links (many per profile)
CREATE TABLE public.company_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to company_materials" ON public.company_materials FOR ALL TO public USING (true) WITH CHECK (true);
