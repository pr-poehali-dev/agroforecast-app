CREATE INDEX IF NOT EXISTS idx_crm_deals_user_stage ON t_p36960093_agroforecast_app.crm_deals(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON t_p36960093_agroforecast_app.crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON t_p36960093_agroforecast_app.crm_contacts(user_id);
