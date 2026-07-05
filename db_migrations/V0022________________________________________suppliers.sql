-- Извлекаем район из адреса (перед "р-н")
UPDATE t_p36960093_agroforecast_app.suppliers
SET district = (regexp_match(address, '([А-ЯЁ][А-ЯЁа-яё\-]+)\s+р-н'))[1]
WHERE address IS NOT NULL
  AND (district IS NULL OR district = '');

-- Извлекаем реальный регион из адреса (область/край/республика)
UPDATE t_p36960093_agroforecast_app.suppliers
SET region = COALESCE(
    (regexp_match(address, '(Республика [А-ЯЁ][А-ЯЁа-яё\s\(\)]+?)(?:,|$)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ская обл)\.?'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ский край)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ край)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ская Республика)'))[1],
    region
)
WHERE address IS NOT NULL;

-- Нормализуем: убираем лишние пробелы
UPDATE t_p36960093_agroforecast_app.suppliers
SET region = btrim(region)
WHERE region IS NOT NULL;
