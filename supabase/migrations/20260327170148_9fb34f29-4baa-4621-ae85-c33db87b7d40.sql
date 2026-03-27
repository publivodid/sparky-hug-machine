ALTER TABLE public.profiles ADD COLUMN last_post_date timestamp with time zone DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN post_frequency_days integer NOT NULL DEFAULT 7;