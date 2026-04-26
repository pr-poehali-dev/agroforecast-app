ALTER TABLE t_p36960093_agroforecast_app.board_listings
  ADD COLUMN moderation_status varchar(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN moderation_comment text NULL,
  ADD COLUMN moderated_at timestamp with time zone NULL;

UPDATE t_p36960093_agroforecast_app.board_listings
  SET moderation_status = 'approved'
  WHERE is_active = true AND is_hidden = false;
