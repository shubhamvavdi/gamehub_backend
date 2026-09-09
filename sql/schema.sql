CREATE DATABASE IF NOT EXISTS gamehub_ads CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gamehub_ads;
CREATE TABLE IF NOT EXISTS games (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, game_id VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(160) NOT NULL, developer_id VARCHAR(100) NULL,
 public_key VARCHAR(128) NULL, public_key_hash CHAR(64) NULL, status ENUM('active','disabled') NOT NULL DEFAULT 'active', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_games_status(status)
);
CREATE TABLE IF NOT EXISTS campaigns (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL,
 status ENUM('draft','active','paused','disabled','expired') NOT NULL DEFAULT 'draft', approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending', review_reason TEXT NULL, reviewed_at DATETIME NULL,
 starts_at DATETIME NULL, ends_at DATETIME NULL, weight INT NOT NULL DEFAULT 1, game_id VARCHAR(100) NULL, placement_id VARCHAR(100) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_campaign_target(status,approval_status,game_id,placement_id), INDEX idx_campaign_dates(starts_at,ends_at)
);
CREATE TABLE IF NOT EXISTS creatives (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, campaign_id INT UNSIGNED NOT NULL, ad_type ENUM('banner','interstitial','rewarded') NOT NULL,
 title VARCHAR(255) NULL, body TEXT NULL, image_url TEXT NULL, html_creative MEDIUMTEXT NULL, click_url TEXT NULL,
 reward_amount DECIMAL(12,2) NULL, reward_currency VARCHAR(32) NULL, reward_name VARCHAR(100) NULL,
 status ENUM('active','paused') NOT NULL DEFAULT 'paused', approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_creative_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
 INDEX idx_creative_select(ad_type,status,approval_status), INDEX idx_creative_campaign(campaign_id)
);
CREATE TABLE IF NOT EXISTS ad_requests (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, game_id VARCHAR(100) NOT NULL, creative_id INT UNSIGNED NOT NULL, placement_id VARCHAR(100) NULL, ad_type VARCHAR(32) NOT NULL,
 impression_at DATETIME NULL, click_at DATETIME NULL, rewarded_at DATETIME NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_request_game(game_id), INDEX idx_request_creative(creative_id), INDEX idx_request_created(created_at)
);
CREATE TABLE IF NOT EXISTS ad_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, creative_id INT UNSIGNED NULL, game_id VARCHAR(100) NULL,
 event_type ENUM('impression','click','sdk_event') NOT NULL, event_name VARCHAR(100) NULL, payload JSON NULL, page_url TEXT NULL, ip VARCHAR(64) NULL, user_agent VARCHAR(500) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_event_creative(creative_id), INDEX idx_event_game(game_id), INDEX idx_event_type(event_type), INDEX idx_event_created(created_at)
);
