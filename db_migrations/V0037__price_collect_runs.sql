-- Журнал запусков сбора цен: видно, был ли сбор в каждый день и чем закончился.
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.price_collect_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP NOT NULL DEFAULT now(),
  trigger VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  saved INT NOT NULL DEFAULT 0,
  sources JSONB,
  message TEXT
);
CREATE INDEX IF NOT EXISTS idx_price_collect_runs_time ON t_p36960093_agroforecast_app.price_collect_runs (started_at DESC);