-- Идентификатор чата MAX у поставщика (заполняется, когда он пишет боту)
ALTER TABLE t_p36960093_agroforecast_app.suppliers
    ADD COLUMN IF NOT EXISTS max_chat_id bigint;

-- Лог входящих сообщений в MAX-бота (для привязки и переписки)
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.max_inbox (
    id serial PRIMARY KEY,
    chat_id bigint,
    sender_name varchar(255),
    text text,
    supplier_id integer,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_max_inbox_chat
    ON t_p36960093_agroforecast_app.max_inbox (chat_id, created_at DESC);
