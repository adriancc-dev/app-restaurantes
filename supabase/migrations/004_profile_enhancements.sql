-- Añadir campos al perfil
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS dietary_preferences JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT
    '{"reservation_confirmed":true,"reminder_24h":true,"reminder_1h":true,"restaurant_news":false}';

-- =====================
-- TABLA: user_favorites
-- =====================
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, restaurant_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own favorites"
  ON user_favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================
-- TABLA: restaurant_reviews
-- ============================
CREATE TABLE IF NOT EXISTS restaurant_reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id  UUID    NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reservation_id UUID    NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reservation_id)
);

ALTER TABLE restaurant_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON restaurant_reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their completed reservations"
  ON restaurant_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM reservations
      WHERE id = reservation_id
        AND user_id = auth.uid()
        AND status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON restaurant_reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON restaurant_reviews FOR DELETE USING (auth.uid() = user_id);
