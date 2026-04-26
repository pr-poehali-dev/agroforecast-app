
CREATE TABLE IF NOT EXISTS board_listings (
  id            SERIAL PRIMARY KEY,
  type          VARCHAR(4)   NOT NULL CHECK (type IN ('sell', 'buy')),
  crop          VARCHAR(100) NOT NULL,
  region        VARCHAR(100) NOT NULL,
  price_per_ton INTEGER      NOT NULL,
  volume_tons   NUMERIC(10,1),
  quality       VARCHAR(200),
  contact       VARCHAR(200),
  description   TEXT,
  source        VARCHAR(50)  NOT NULL DEFAULT 'user',
  source_url    TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS board_listings_crop_idx    ON board_listings(crop);
CREATE INDEX IF NOT EXISTS board_listings_region_idx  ON board_listings(region);
CREATE INDEX IF NOT EXISTS board_listings_type_idx    ON board_listings(type);
CREATE INDEX IF NOT EXISTS board_listings_active_idx  ON board_listings(is_active);
