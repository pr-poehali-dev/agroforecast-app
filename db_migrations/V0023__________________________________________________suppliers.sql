-- 1. Помечаем мусорные строки-заголовки как отклонённые (чтобы не мешали аналитике)
UPDATE t_p36960093_agroforecast_app.suppliers
SET status = 'rejected', name = '[служебная строка] ' || name
WHERE (name ILIKE '%Название предприятия%'
   OR name ILIKE '%наименование предприятия%'
   OR activity = 'Направление деятельности')
  AND name NOT LIKE '[служебная строка]%';

-- 2. Доизвлекаем регион для тех, у кого адрес есть, но регион остался дефолтным «Саратовская область»
UPDATE t_p36960093_agroforecast_app.suppliers
SET region = sub.reg
FROM (
  SELECT id, COALESCE(
    (regexp_match(address, '(Республика [А-ЯЁ][А-ЯЁа-яё\-]+(?: \([А-ЯЁ][а-яё]+\))?)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ская Республика)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ская обл)\.?'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ый край|[А-ЯЁ][а-яё\-]+ий край|[А-ЯЁ][а-яё\-]+ой край)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ая Республика)'))[1],
    (regexp_match(address, 'г\. (Москва|Санкт-Петербург|Севастополь)'))[1],
    (regexp_match(address, '([А-ЯЁ][а-яё\-]+ский автономный округ)'))[1]
  ) AS reg
  FROM t_p36960093_agroforecast_app.suppliers
  WHERE region = 'Саратовская область' AND address IS NOT NULL AND address <> ''
) sub
WHERE suppliers.id = sub.id AND sub.reg IS NOT NULL;

-- 3. Унифицируем сокращённые названия регионов до полной формы
UPDATE t_p36960093_agroforecast_app.suppliers SET region = 'Саратовская область' WHERE region IN ('Саратовская обл','Саратовская обл.');
UPDATE t_p36960093_agroforecast_app.suppliers SET region = regexp_replace(region, ' обл$', ' область') WHERE region ~ ' обл$';
UPDATE t_p36960093_agroforecast_app.suppliers SET region = btrim(region) WHERE region IS NOT NULL;
