-- ─────────────────────────────────────────────────────────────
-- 1. Corregir trigger: capturar full_name y phone del registro
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')),     '')
  );
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Tabla de tokens OTP para cambios de datos sensibles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_change_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code       CHAR(6)     NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profile_change_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tokens"
  ON profile_change_tokens FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON profile_change_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON profile_change_tokens FOR DELETE USING (auth.uid() = user_id);

-- Limpiar tokens expirados automáticamente (requiere pg_cron habilitado)
SELECT cron.schedule(
  'cleanup-profile-tokens',
  '0 * * * *',
  $$DELETE FROM profile_change_tokens WHERE expires_at < NOW()$$
);
