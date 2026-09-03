CREATE POLICY "insert own ingest tokens"
ON public.ingest_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);