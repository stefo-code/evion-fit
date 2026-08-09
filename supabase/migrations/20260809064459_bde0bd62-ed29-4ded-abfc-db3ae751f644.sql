CREATE TABLE public.health_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  metric text NOT NULL,
  value double precision NOT NULL,
  unit text NOT NULL DEFAULT '',
  measured_at timestamptz NOT NULL,
  quality text NOT NULL DEFAULT 'gemessen',
  priority integer NOT NULL DEFAULT 50,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, metric, measured_at)
);
CREATE INDEX health_samples_user_metric_idx ON public.health_samples (user_id, metric, measured_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_samples TO authenticated;
GRANT ALL ON public.health_samples TO service_role;
ALTER TABLE public.health_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own health samples" ON public.health_samples FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.health_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  connected boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT '{}',
  auto_sync_minutes integer NOT NULL DEFAULT 60,
  last_sync_at timestamptz,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_sources TO authenticated;
GRANT ALL ON public.health_sources TO service_role;
ALTER TABLE public.health_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own health sources" ON public.health_sources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  status text NOT NULL,
  received integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sync_runs_user_idx ON public.sync_runs (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sync runs" ON public.sync_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ingest_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  label text NOT NULL DEFAULT 'Android-Brücke',
  revoked boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ingest_tokens_user_idx ON public.ingest_tokens (user_id);
GRANT SELECT, DELETE, UPDATE ON public.ingest_tokens TO authenticated;
GRANT ALL ON public.ingest_tokens TO service_role;
ALTER TABLE public.ingest_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ingest tokens" ON public.ingest_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "revoke own ingest tokens" ON public.ingest_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own ingest tokens" ON public.ingest_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);