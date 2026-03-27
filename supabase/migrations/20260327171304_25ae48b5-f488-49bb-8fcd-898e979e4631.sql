ALTER TABLE public.profiles ADD COLUMN previous_post_date timestamp with time zone DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN last_post_action_at timestamp with time zone DEFAULT NULL;