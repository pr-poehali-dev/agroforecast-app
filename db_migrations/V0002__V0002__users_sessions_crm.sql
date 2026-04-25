-- ══════════════════════════════════════════════════════════════
-- АгроПорт: Пользователи, Сессии, CRM
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(50) DEFAULT 'farmer',
  is_verified BOOLEAN DEFAULT FALSE,
  verify_token VARCHAR(64),
  reset_token VARCHAR(64),
  reset_expires TIMESTAMPTZ,
  plan VARCHAR(50) DEFAULT 'free',
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  email VARCHAR(255),
  company VARCHAR(255),
  position VARCHAR(255),
  type VARCHAR(50) DEFAULT 'client',
  status VARCHAR(50) DEFAULT 'active',
  source VARCHAR(100),
  region VARCHAR(100),
  tags TEXT[],
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_id INTEGER REFERENCES crm_contacts(id) ON UPDATE CASCADE,
  source VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  budget DECIMAL(15,2),
  crop VARCHAR(100),
  area_ha DECIMAL(10,2),
  region VARCHAR(100),
  notes TEXT,
  assigned_to VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  title VARCHAR(255) NOT NULL,
  contact_id INTEGER REFERENCES crm_contacts(id) ON UPDATE CASCADE,
  lead_id INTEGER REFERENCES crm_leads(id) ON UPDATE CASCADE,
  stage VARCHAR(100) DEFAULT 'new',
  amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'RUB',
  probability INTEGER DEFAULT 0,
  crop VARCHAR(100),
  volume_t DECIMAL(10,2),
  price_per_t DECIMAL(10,2),
  region VARCHAR(100),
  close_date DATE,
  assigned_to VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  contact_id INTEGER REFERENCES crm_contacts(id) ON UPDATE CASCADE,
  deal_id INTEGER REFERENCES crm_deals(id) ON UPDATE CASCADE,
  assigned_to VARCHAR(255),
  tags TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contact_id INTEGER REFERENCES crm_contacts(id) ON UPDATE CASCADE,
  deal_id INTEGER REFERENCES crm_deals(id) ON UPDATE CASCADE,
  task_id INTEGER REFERENCES crm_tasks(id) ON UPDATE CASCADE,
  duration_min INTEGER,
  result VARCHAR(100),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_user ON crm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_user ON crm_activities(user_id);
