
-- Добавляем таблицу компаний
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.crm_companies (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES t_p36960093_agroforecast_app.users(id),
  name       VARCHAR(255) NOT NULL,
  inn        VARCHAR(20),
  industry   VARCHAR(100),
  region     VARCHAR(100),
  website    VARCHAR(255),
  phone      VARCHAR(100),
  email      VARCHAR(255),
  address    TEXT,
  employees  INTEGER,
  revenue    NUMERIC(15,2),
  notes      TEXT,
  tags       TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Добавляем company_id в contacts
ALTER TABLE t_p36960093_agroforecast_app.crm_contacts
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES t_p36960093_agroforecast_app.crm_companies(id);

-- Добавляем company_id в deals
ALTER TABLE t_p36960093_agroforecast_app.crm_deals
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES t_p36960093_agroforecast_app.crm_companies(id);

-- Таблица событий/активностей (звонки, письма, встречи)
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.crm_events (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES t_p36960093_agroforecast_app.users(id),
  type        VARCHAR(50) NOT NULL DEFAULT 'note',
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  contact_id  INTEGER REFERENCES t_p36960093_agroforecast_app.crm_contacts(id),
  deal_id     INTEGER REFERENCES t_p36960093_agroforecast_app.crm_deals(id),
  company_id  INTEGER REFERENCES t_p36960093_agroforecast_app.crm_companies(id),
  event_date  TIMESTAMPTZ DEFAULT now(),
  duration_min INTEGER,
  result      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Таблица воронки/пайплайна (кастомные этапы)
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.crm_pipeline_stages (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER REFERENCES t_p36960093_agroforecast_app.users(id),
  name     VARCHAR(100) NOT NULL,
  color    VARCHAR(20) DEFAULT '#2E7D32',
  position INTEGER DEFAULT 0,
  is_win   BOOLEAN DEFAULT false,
  is_lost  BOOLEAN DEFAULT false
);

-- Вставляем дефолтные этапы воронки
INSERT INTO t_p36960093_agroforecast_app.crm_pipeline_stages (user_id, name, color, position, is_win, is_lost)
VALUES
  (NULL, 'Новый',        '#64748b', 0, false, false),
  (NULL, 'Переговоры',   '#3b82f6', 1, false, false),
  (NULL, 'Коммерческое', '#f59e0b', 2, false, false),
  (NULL, 'Согласование', '#8b5cf6', 3, false, false),
  (NULL, 'Выигран',      '#2E7D32', 4, true,  false),
  (NULL, 'Проигран',     '#ef4444', 5, false, true)
ON CONFLICT DO NOTHING;
