-- Дозаполняем район из адреса для записей на ИНН 64 (саратовские) без района
UPDATE t_p36960093_agroforecast_app.suppliers
SET district = (regexp_match(address, '([А-ЯЁ][А-ЯЁа-яё\-]+)\s+р-н'))[1]
WHERE inn LIKE '64%'
  AND (district IS NULL OR district = '')
  AND address IS NOT NULL;

-- CRM-поля прямо в suppliers
ALTER TABLE t_p36960093_agroforecast_app.suppliers
  ADD COLUMN IF NOT EXISTS is_farmer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_analysis text,
  ADD COLUMN IF NOT EXISTS ai_letter text,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamp without time zone;

-- Помечаем сельхозпроизводителей: по виду деятельности/культурам/названию (КФХ, СПК, агро)
UPDATE t_p36960093_agroforecast_app.suppliers
SET is_farmer = true
WHERE name NOT LIKE '[служебная строка]%'
  AND (
    activity ~* 'растениевод|зерновод|животновод|овощевод|садовод|семеновод|бахчевод|свеклов|птицеводств|свиноводств|овцеводств|пчеловодств|выращивание|земледел'
    OR crops ~* 'пшениц|подсолнеч|зерн|ячмень|рожь|кукуруз|соя|рапс|свекл|овощ|картофел|молоко|скот|мясо'
    OR name ~* 'КРЕСТЬЯНСКО|ФЕРМЕРСК|КФХ|СЕЛЬСКОХОЗЯЙСТВЕН|СПК|АГРО|КОЛХОЗ|НИВА|ПЛЕМ'
  );

-- Приоритет 2 — районы вокруг Аткарска, приоритет 1 — прочие саратовские (ИНН 64)
UPDATE t_p36960093_agroforecast_app.suppliers
SET priority = 2
WHERE is_farmer = true
  AND district IN ('Аткарский','Екатериновский','Петровский','Калининский','Лысогорский','Татищевский','Аркадакский');

UPDATE t_p36960093_agroforecast_app.suppliers
SET priority = 1
WHERE is_farmer = true AND priority = 0 AND inn LIKE '64%';

CREATE INDEX IF NOT EXISTS idx_suppliers_farmer ON t_p36960093_agroforecast_app.suppliers (is_farmer, priority);
