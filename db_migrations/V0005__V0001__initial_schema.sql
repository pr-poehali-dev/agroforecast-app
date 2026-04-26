CREATE TABLE IF NOT EXISTS portfolio_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'guest',
  crop TEXT NOT NULL,
  area_ha FLOAT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Самарская',
  custom_yield FLOAT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_items_user_idx ON portfolio_items (user_id);

CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  regions TEXT[] DEFAULT '{}',
  crops TEXT[] DEFAULT '{}',
  notifications JSONB DEFAULT '{"email": true, "critical": true, "price_alerts": true, "weather": true, "triggers": [], "alert_email": ""}',
  profile JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'farmer',
  is_verified BOOLEAN DEFAULT FALSE,
  verify_token TEXT,
  reset_token TEXT,
  reset_expires TIMESTAMP,
  plan TEXT DEFAULT 'free',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  region TEXT,
  crop TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'active',
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  contact_id INTEGER REFERENCES crm_contacts(id),
  title TEXT NOT NULL,
  crop TEXT,
  volume_t FLOAT,
  price_per_t FLOAT,
  region TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  contact_id INTEGER REFERENCES crm_contacts(id),
  title TEXT NOT NULL,
  crop TEXT,
  volume_t FLOAT,
  price_per_t FLOAT,
  total_amount FLOAT,
  stage TEXT DEFAULT 'new',
  region TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  deal_id INTEGER REFERENCES crm_deals(id),
  contact_id INTEGER REFERENCES crm_contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'normal',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics_routes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'guest',
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  from_lat FLOAT,
  from_lon FLOAT,
  to_lat FLOAT,
  to_lon FLOAT,
  from_region TEXT,
  to_region TEXT,
  distance_km FLOAT,
  cargo_type TEXT,
  weight_tons FLOAT,
  vehicle_type TEXT,
  cost_estimate FLOAT,
  cost_per_ton FLOAT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);