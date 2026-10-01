-- Цены закупщиков из открытого API сервиса «Цена Зерна» (api.silkagro.ru), базис CPT.
-- Одна строка = одна цена конкретного закупщика на конкретном элеваторе/терминале в конкретный день.
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.buyer_prices (
  id SERIAL PRIMARY KEY,
  source VARCHAR(40) NOT NULL DEFAULT 'cenazerna',
  source_price_id VARCHAR(40) NOT NULL,
  crop VARCHAR(40) NOT NULL,
  crop_class VARCHAR(40),
  price_rub_t NUMERIC(12,2) NOT NULL,
  diff_rub_t NUMERIC(12,2),
  basis VARCHAR(10) NOT NULL DEFAULT 'CPT',
  region VARCHAR(120),
  warehouse VARCHAR(255),
  company VARCHAR(255),
  company_inn VARCHAR(20),
  railway BOOLEAN,
  verified BOOLEAN,
  specs TEXT,
  lat NUMERIC(10,6),
  lon NUMERIC(10,6),
  price_date DATE NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (source, source_price_id, price_date)
);
CREATE INDEX IF NOT EXISTS idx_buyer_prices_crop_date ON t_p36960093_agroforecast_app.buyer_prices (crop, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_buyer_prices_region ON t_p36960093_agroforecast_app.buyer_prices (region);