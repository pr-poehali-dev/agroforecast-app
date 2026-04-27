CREATE TABLE IF NOT EXISTS crop_yields (
    id SERIAL PRIMARY KEY,
    region VARCHAR(200) NOT NULL,
    region_code VARCHAR(20),
    crop VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    yield_centner_per_ha NUMERIC(10,2),
    gross_harvest_tons NUMERIC(15,2),
    sown_area_ha NUMERIC(15,2),
    source VARCHAR(50) DEFAULT 'rosstat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region, crop, year)
);

CREATE INDEX IF NOT EXISTS idx_crop_yields_region ON crop_yields(region);
CREATE INDEX IF NOT EXISTS idx_crop_yields_crop ON crop_yields(crop);
CREATE INDEX IF NOT EXISTS idx_crop_yields_year ON crop_yields(year);
CREATE INDEX IF NOT EXISTS idx_crop_yields_filter ON crop_yields(crop, year);

CREATE TABLE IF NOT EXISTS yield_forecasts (
    id SERIAL PRIMARY KEY,
    region VARCHAR(200) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    forecast_year INTEGER NOT NULL,
    predicted_yield NUMERIC(10,2),
    confidence NUMERIC(5,2),
    reasoning TEXT,
    model VARCHAR(50) DEFAULT 'deepseek',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region, crop, forecast_year)
);

CREATE INDEX IF NOT EXISTS idx_yield_forecasts_lookup ON yield_forecasts(region, crop, forecast_year);
