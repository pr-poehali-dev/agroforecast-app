-- База сельхозпроизводителей (поставщиков) по регионам/районам
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    inn VARCHAR(20),
    region TEXT NOT NULL DEFAULT 'Саратовская область',
    district TEXT,
    locality TEXT,
    crops TEXT,
    volume_tons NUMERIC(12,2),
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    source VARCHAR(30) NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_region ON t_p36960093_agroforecast_app.suppliers(region);
CREATE INDEX IF NOT EXISTS idx_suppliers_district ON t_p36960093_agroforecast_app.suppliers(district);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON t_p36960093_agroforecast_app.suppliers(status);

-- Планы работы по регионам (одна запись на регион, план-стратегия)
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.region_plans (
    id SERIAL PRIMARY KEY,
    region TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    partner TEXT,
    content TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Стартовый план по Саратовской области (партнёр в Аткарске)
INSERT INTO t_p36960093_agroforecast_app.region_plans (region, title, partner, content)
VALUES (
  'Саратовская область',
  'План работы: Саратовская область',
  'Приёмный пункт в г. Аткарск (подсолнечник, пшеница)',
  E'ЦЕЛЬ: сформировать базу реальных сельхозпроизводителей Саратовской области и наладить поставки подсолнечника и пшеницы на приёмный пункт партнёра в Аткарске.\n\nЭТАП 1. Сбор базы поставщиков (недели 1–3)\n- Выгрузить перечень хозяйств (КФХ, СХО, агрохолдинги) по районам области.\n- Приоритет — районы вокруг Аткарска: Аткарский, Екатериновский, Петровский, Калининский, Лысогорский, Татищевский, Аркадакский.\n- Занести в базу: название, ИНН, район, культуры, ориентировочный объём, контакты.\n\nЭТАП 2. Квалификация (недели 2–4)\n- Прозвон и первичный контакт, статус: новый → в работе → переговоры → партнёр.\n- Уточнить объёмы подсолнечника и пшеницы, качество, сроки готовности к отгрузке.\n\nЭТАП 3. Логистика и приёмка (недели 4–6)\n- Согласовать условия приёмки в Аткарске: цена, качество, самовывоз/доставка.\n- Составить график заездов по урожаю подсолнечника (сентябрь–октябрь) и пшеницы (июль–август).\n\nКРИТЕРИИ УСПЕХА: 50+ хозяйств в базе, 15+ в переговорах, 5+ подписанных на приёмку в первый сезон.'
)
ON CONFLICT (region) DO NOTHING;
