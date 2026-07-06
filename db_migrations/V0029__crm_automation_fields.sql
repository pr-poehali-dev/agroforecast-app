ALTER TABLE t_p36960093_agroforecast_app.crm_deals
  ADD COLUMN IF NOT EXISTS next_step text,
  ADD COLUMN IF NOT EXISTS next_step_at timestamptz,
  ADD COLUMN IF NOT EXISTS health integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS supplier_id integer,
  ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz DEFAULT now();
