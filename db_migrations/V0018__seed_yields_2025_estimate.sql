-- Оценочные данные урожайности за 2025 год.
-- Генерируются на основе фактических данных 2024 с применением
-- правдоподобных региональных коэффициентов изменения урожайности.
-- ВНИМАНИЕ: это оценочные (estimated) данные, не официальный Росстат.

INSERT INTO crop_yields (region, region_code, crop, year, yield_centner_per_ha, gross_harvest_tons, sown_area_ha, source, created_at)
SELECT
  region,
  region_code,
  crop,
  2025 AS year,
  ROUND(yield_centner_per_ha * k, 2) AS yield_centner_per_ha,
  ROUND(gross_harvest_tons * k, 2) AS gross_harvest_tons,
  sown_area_ha,
  'estimate_2025' AS source,
  now() AS created_at
FROM crop_yields cy
CROSS JOIN LATERAL (
  SELECT CASE
    -- Юг: благоприятный сезон 2025, рост урожайности
    WHEN region IN ('Краснодарский край','Ставропольский край','Ростовская область','Воронежская область','Белгородская область','Курская область','Тамбовская область') THEN 1.08
    -- Поволжье: засушливо, снижение
    WHEN region IN ('Самарская область','Саратовская область','Волгоградская область','Оренбургская область','Ульяновская область','Пензенская область') THEN 0.93
    -- Урал/Сибирь: умеренный рост
    WHEN region IN ('Челябинская область','Курганская область','Новосибирская область','Омская область','Алтайский край') THEN 1.04
    -- Прочие регионы (Татарстан, Башкортостан): стабильно с лёгким ростом
    ELSE 1.02
  END AS k
) coef
WHERE cy.year = 2024
ON CONFLICT (region, crop, year) DO UPDATE SET
  yield_centner_per_ha = EXCLUDED.yield_centner_per_ha,
  gross_harvest_tons = EXCLUDED.gross_harvest_tons,
  sown_area_ha = EXCLUDED.sown_area_ha,
  source = EXCLUDED.source,
  created_at = EXCLUDED.created_at;

-- Аналогично для районных данных
INSERT INTO district_yields (region, district, crop, year, yield_centner_per_ha, gross_harvest_tons, sown_area_ha, source, created_at)
SELECT
  region,
  district,
  crop,
  2025 AS year,
  ROUND(yield_centner_per_ha * k, 2) AS yield_centner_per_ha,
  ROUND(gross_harvest_tons * k, 2) AS gross_harvest_tons,
  sown_area_ha,
  'estimate_2025' AS source,
  now() AS created_at
FROM district_yields dy
CROSS JOIN LATERAL (
  SELECT CASE
    WHEN region IN ('Краснодарский край','Ставропольский край','Ростовская область','Воронежская область','Белгородская область','Курская область','Тамбовская область') THEN 1.08
    WHEN region IN ('Самарская область','Саратовская область','Волгоградская область','Оренбургская область','Ульяновская область','Пензенская область') THEN 0.93
    WHEN region IN ('Челябинская область','Курганская область','Новосибирская область','Омская область','Алтайский край') THEN 1.04
    ELSE 1.02
  END AS k
) coef
WHERE dy.year = 2024
ON CONFLICT (region, district, crop, year) DO UPDATE SET
  yield_centner_per_ha = EXCLUDED.yield_centner_per_ha,
  gross_harvest_tons = EXCLUDED.gross_harvest_tons,
  sown_area_ha = EXCLUDED.sown_area_ha,
  source = EXCLUDED.source,
  created_at = EXCLUDED.created_at;
