-- Исходящие сообщения ИИ-закупщика (email/MAX): черновики и отправленные
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.supplier_messages (
    id serial PRIMARY KEY,
    supplier_id integer NOT NULL,
    channel varchar(20) NOT NULL DEFAULT 'email',   -- email | max
    recipient varchar(255),                          -- email или max chat id
    subject varchar(500),
    body text NOT NULL DEFAULT '',
    status varchar(20) NOT NULL DEFAULT 'draft',     -- draft | sent | failed
    error text,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    sent_at timestamp without time zone
);

CREATE INDEX IF NOT EXISTS idx_messages_supplier
    ON t_p36960093_agroforecast_app.supplier_messages (supplier_id, created_at DESC);
