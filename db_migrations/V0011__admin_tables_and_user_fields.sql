
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.admin_sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT,
    category VARCHAR(100) DEFAULT 'рынок',
    crop VARCHAR(100) DEFAULT 'Все культуры',
    impact VARCHAR(20) DEFAULT 'neutral',
    urgency VARCHAR(20) DEFAULT 'medium',
    source VARCHAR(200),
    source_url TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.appeals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE t_p36960093_agroforecast_app.users
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;
