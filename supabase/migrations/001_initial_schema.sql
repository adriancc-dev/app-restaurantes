-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================
-- TABLA: profiles
-- =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'restaurant')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- TABLA: locations
-- =====================
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

INSERT INTO locations (name, slug) VALUES
  ('Moncofa', 'moncofa'),
  ('Nules', 'nules'),
  ('La Vall d''Uixó', 'la-vall-duixo');

-- =====================
-- TABLA: restaurants
-- =====================
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location_id INTEGER REFERENCES locations(id),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  menu_url TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (
    subscription_status IN ('active', 'inactive', 'past_due', 'canceled')
  ),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- TABLA: restaurant_hours
-- =====================
CREATE TABLE restaurant_hours (
  id SERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  slot_duration INTEGER DEFAULT 60,
  max_capacity INTEGER DEFAULT 10,
  UNIQUE(restaurant_id, day_of_week)
);

-- =====================
-- TABLA: reservations
-- =====================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  status TEXT DEFAULT 'confirmed' CHECK (
    status IN ('confirmed', 'cancelled', 'completed', 'no_show')
  ),
  notes TEXT,
  notification_24h_sent BOOLEAN DEFAULT FALSE,
  notification_1h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_notifications ON reservations(date, status, notification_24h_sent, notification_1h_sent);

-- =====================
-- TABLA: push_tokens
-- =====================
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario ve y edita solo el suyo
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- restaurants: lectura pública de activos, escritura solo al dueño
CREATE POLICY "restaurants_select_active" ON restaurants FOR SELECT
  USING (is_active = TRUE OR auth.uid() = owner_id);
CREATE POLICY "restaurants_insert_own" ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "restaurants_update_own" ON restaurants FOR UPDATE
  USING (auth.uid() = owner_id);

-- restaurant_hours: lectura pública, escritura solo al dueño del restaurante
CREATE POLICY "hours_select" ON restaurant_hours FOR SELECT USING (TRUE);
CREATE POLICY "hours_write" ON restaurant_hours FOR ALL
  USING (
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );

-- reservations: usuario ve las suyas, restaurante ve las del restaurante
CREATE POLICY "reservations_user_select" ON reservations FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );
CREATE POLICY "reservations_user_insert" ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_user_update" ON reservations FOR UPDATE
  USING (auth.uid() = user_id);

-- push_tokens: solo el propio usuario
CREATE POLICY "push_tokens_own" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- =====================
-- FUNCIÓN: contar reservas por slot
-- =====================
CREATE OR REPLACE FUNCTION get_slot_count(
  p_restaurant_id UUID,
  p_date DATE,
  p_time TIME
) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM reservations
  WHERE restaurant_id = p_restaurant_id
    AND date = p_date
    AND time = p_time
    AND status NOT IN ('cancelled', 'no_show');
$$ LANGUAGE SQL STABLE;

-- =====================
-- CRON: enviar notificaciones (cada 15 min)
-- =====================
SELECT cron.schedule(
  'send-reservation-notifications',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
