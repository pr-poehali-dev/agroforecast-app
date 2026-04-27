CREATE TABLE IF NOT EXISTS district_yields (
    id SERIAL PRIMARY KEY,
    region VARCHAR(200) NOT NULL,
    district VARCHAR(200) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    yield_centner_per_ha NUMERIC(10,2),
    gross_harvest_tons NUMERIC(15,2),
    sown_area_ha NUMERIC(15,2),
    source VARCHAR(50) DEFAULT 'rosstat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region, district, crop, year)
);

CREATE INDEX IF NOT EXISTS idx_district_yields_region ON district_yields(region);
CREATE INDEX IF NOT EXISTS idx_district_yields_crop_year ON district_yields(crop, year);
CREATE INDEX IF NOT EXISTS idx_district_yields_district ON district_yields(district);
