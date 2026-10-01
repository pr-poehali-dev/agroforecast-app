-- Открытые ряды и результаты проверки модели прогноза цен.
-- price_history: средние цены производителей (Росстат: ЕМИСС 31454, 57693; cena_sx), руб/т, на конец месяца, РФ.
-- world_prices: мировые цены Всемирного банка (Pink Sheet), USD/т.
-- fx_rates: среднемесячный курс USD/RUB Банка России.
-- model_backtests: метрики проверки на истории.
-- price_quotes: накопление котировок, собираемых с сайтов.
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.price_history (
  crop VARCHAR(20) NOT NULL, period DATE NOT NULL, price_rub_t NUMERIC(12,2) NOT NULL,
  source VARCHAR(100) NOT NULL, PRIMARY KEY (crop, period));
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.world_prices (
  crop VARCHAR(20) NOT NULL, period DATE NOT NULL, price_usd_t NUMERIC(12,2) NOT NULL,
  series VARCHAR(60) NOT NULL, PRIMARY KEY (crop, period));
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.fx_rates (
  period DATE PRIMARY KEY, usd_rub NUMERIC(10,4) NOT NULL);
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.model_backtests (
  id SERIAL PRIMARY KEY, crop VARCHAR(20) NOT NULL, horizon INT NOT NULL,
  params JSONB NOT NULL, metrics JSONB NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.price_quotes (
  id SERIAL PRIMARY KEY, crop VARCHAR(60) NOT NULL, price_rub_t NUMERIC(12,2) NOT NULL,
  source VARCHAR(100) NOT NULL, fetched_at TIMESTAMP NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_price_quotes_crop_time ON t_p36960093_agroforecast_app.price_quotes (crop, fetched_at DESC);