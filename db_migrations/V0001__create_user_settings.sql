
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL DEFAULT 'default',
  regions TEXT[] DEFAULT '{}',
  crops TEXT[] DEFAULT '{}',
  notifications JSONB DEFAULT '{"email": true, "critical": true, "price_alerts": true, "weather": true}',
  profile JSONB DEFAULT '{"name": "Алексей Воронов", "role": "Агроном-аналитик", "org": "АгроВолга Холдинг"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

INSERT INTO t_p36960093_agroforecast_app.user_settings (user_id)
VALUES ('default')
ON CONFLICT (user_id) DO NOTHING;
