CREATE TABLE t_p36960093_agroforecast_app.logistics_routes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  from_city VARCHAR(200) NOT NULL,
  to_city VARCHAR(200) NOT NULL,
  distance_km NUMERIC(10,1),
  cargo_type VARCHAR(100) DEFAULT 'grain',
  weight_tons NUMERIC(10,2),
  vehicle_type VARCHAR(50) DEFAULT 'truck_20t',
  cost_estimate NUMERIC(12,2),
  cost_per_ton NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'estimate',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
