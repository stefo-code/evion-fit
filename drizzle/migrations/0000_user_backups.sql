CREATE TABLE public.user_backups (
  user_id uuid PRIMARY KEY,
  daten jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_backups TO authenticated;
GRANT ALL ON public.user_backups TO service_role;
ALTER TABLE public.user_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.user_backups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.user_backups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.user_backups FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.user_backups FOR DELETE TO authenticated USING (auth.uid() = user_id);