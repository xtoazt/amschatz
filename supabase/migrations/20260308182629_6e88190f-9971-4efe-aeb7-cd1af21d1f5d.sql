CREATE TABLE public.cached_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sha text NOT NULL,
  message text NOT NULL,
  author_name text NOT NULL,
  author_date timestamptz NOT NULL,
  html_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cached_commits_sha ON public.cached_commits(sha);

ALTER TABLE public.cached_commits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached commits" ON public.cached_commits FOR SELECT USING (true);

CREATE TABLE public.commits_cache_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latest_sha text NOT NULL,
  total_commits integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commits_cache_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache meta" ON public.commits_cache_meta FOR SELECT USING (true);