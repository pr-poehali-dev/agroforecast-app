-- Служебные строки-заголовки «Почтовый адрес» и подобные — помечаем
UPDATE t_p36960093_agroforecast_app.suppliers
SET status = 'rejected', name = '[служебная строка] ' || name
WHERE address IN ('Почтовый адрес','Название предприятия')
  AND name NOT LIKE '[служебная строка]%';

-- Записи, где регион не удалось определить по адресу (город без области),
-- ошибочно помечены «Саратовская область» — выносим в «Регион не определён»,
-- чтобы не искажать саратовскую аналитику
UPDATE t_p36960093_agroforecast_app.suppliers
SET region = 'Регион не определён'
WHERE region = 'Саратовская область'
  AND address IS NOT NULL AND address <> ''
  AND address NOT ILIKE '%саратов%'
  AND name NOT LIKE '[служебная строка]%';
