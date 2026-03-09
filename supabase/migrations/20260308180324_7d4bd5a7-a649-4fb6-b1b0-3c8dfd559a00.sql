
CREATE TABLE public.feature_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latest_sha text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature summaries"
  ON public.feature_summaries
  FOR SELECT
  TO anon, authenticated
  USING (true);
