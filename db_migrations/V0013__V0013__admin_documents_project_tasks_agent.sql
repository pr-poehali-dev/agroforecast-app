
-- Таблица документов (стратегия, планы, файлы администратора)
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.admin_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица задач менеджера проекта
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.project_tasks (
    id SERIAL PRIMARY KEY,
    stage INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- История чата с ИИ-агентом
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.agent_messages (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
