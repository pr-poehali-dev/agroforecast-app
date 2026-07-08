-- Кэш ленты новостей АПК из открытых источников (RSS-агрегатор).
-- Отдельно от ручной таблицы news, чтобы автособранные новости не смешивались с редакционными.
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.news_feed (
    id           SERIAL PRIMARY KEY,
    uid          VARCHAR(64) NOT NULL UNIQUE,        -- хэш для дедупликации (ссылка/заголовок)
    title        VARCHAR(500) NOT NULL,
    summary      TEXT DEFAULT '',
    source       VARCHAR(200) DEFAULT '',
    source_url   TEXT DEFAULT '',
    category     VARCHAR(100) DEFAULT 'рынок',
    crop         VARCHAR(100) DEFAULT 'Все культуры',
    impact       VARCHAR(20) DEFAULT 'neutral',
    urgency      VARCHAR(20) DEFAULT 'medium',
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- дата новости из источника
    fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now()   -- когда мы её забрали
);

CREATE INDEX IF NOT EXISTS idx_news_feed_published ON t_p36960093_agroforecast_app.news_feed (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_feed_category ON t_p36960093_agroforecast_app.news_feed (category);
