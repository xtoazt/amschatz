
CREATE TABLE public.room_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read room passwords"
ON public.room_passwords
FOR SELECT
TO anon, authenticated
USING (true);
