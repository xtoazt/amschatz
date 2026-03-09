CREATE TABLE public.changelog_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  latest_sha text NOT NULL,
  summary text NOT NULL
);

ALTER TABLE public.changelog_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read changelog summaries" ON public.changelog_summaries
  FOR SELECT USING (true);