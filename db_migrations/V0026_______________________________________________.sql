-- История взаимодействий с поставщиком (CRM-таймлайн)
CREATE TABLE IF NOT EXISTS t_p36960093_agroforecast_app.supplier_interactions (
    id serial PRIMARY KEY,
    supplier_id integer NOT NULL,
    type varchar(20) NOT NULL DEFAULT 'note',
    content text NOT NULL DEFAULT '',
    author varchar(100),
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_supplier
    ON t_p36960093_agroforecast_app.supplier_interactions (supplier_id, created_at DESC);
