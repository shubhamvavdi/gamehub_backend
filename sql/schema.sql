CREATE TABLE IF NOT EXISTS games (
 id BIGSERIAL PRIMARY KEY, game_id VARCHAR(100) NOT NULL UNIQUE, slug VARCHAR(160) UNIQUE, name VARCHAR(160) NOT NULL, category VARCHAR(80) NOT NULL DEFAULT 'Arcade', rating NUMERIC(2,1) NOT NULL DEFAULT 0.0, thumbnail_url TEXT, description TEXT, tags JSONB, badge VARCHAR(40), game_url TEXT, plays BIGINT NOT NULL DEFAULT 0, featured BOOLEAN NOT NULL DEFAULT FALSE, developer_id VARCHAR(100),
 public_key VARCHAR(128), public_key_hash CHAR(64), status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

CREATE TABLE IF NOT EXISTS campaigns (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(160) NOT NULL,
 status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','disabled','expired')), approval_status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')), review_reason TEXT, reviewed_at TIMESTAMPTZ,
 starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, weight INT NOT NULL DEFAULT 1, game_id VARCHAR(100), placement_id VARCHAR(100), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_campaign_target ON campaigns(status,approval_status,game_id,placement_id);
CREATE INDEX IF NOT EXISTS idx_campaign_dates ON campaigns(starts_at,ends_at);

CREATE TABLE IF NOT EXISTS creatives (
 id BIGSERIAL PRIMARY KEY, campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE, ad_type VARCHAR(16) NOT NULL CHECK (ad_type IN ('banner','interstitial','rewarded')),
 title VARCHAR(255), body TEXT, image_url TEXT, html_creative TEXT, click_url TEXT,
 reward_amount NUMERIC(12,2), reward_currency VARCHAR(32), reward_name VARCHAR(100),
 status VARCHAR(16) NOT NULL DEFAULT 'paused' CHECK (status IN ('active','paused')), approval_status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_creative_select ON creatives(ad_type,status,approval_status);
CREATE INDEX IF NOT EXISTS idx_creative_campaign ON creatives(campaign_id);

CREATE TABLE IF NOT EXISTS ad_requests (
 id BIGSERIAL PRIMARY KEY, game_id VARCHAR(100) NOT NULL, creative_id BIGINT NOT NULL, placement_id VARCHAR(100), ad_type VARCHAR(32) NOT NULL,
 impression_at TIMESTAMPTZ, click_at TIMESTAMPTZ, rewarded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_request_game ON ad_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_request_creative ON ad_requests(creative_id);
CREATE INDEX IF NOT EXISTS idx_request_created ON ad_requests(created_at);

CREATE TABLE IF NOT EXISTS ad_events (
 id BIGSERIAL PRIMARY KEY, creative_id BIGINT, game_id VARCHAR(100),
 event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('impression','click','sdk_event')), event_name VARCHAR(100), payload JSONB, page_url TEXT, ip VARCHAR(64), user_agent VARCHAR(500),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_event_creative ON ad_events(creative_id);
CREATE INDEX IF NOT EXISTS idx_event_game ON ad_events(game_id);
CREATE INDEX IF NOT EXISTS idx_event_type ON ad_events(event_type);
CREATE INDEX IF NOT EXISTS idx_event_created ON ad_events(created_at);
