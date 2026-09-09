const pool=require('../config/db');

class DirectCampaignProvider{
 async findAd({gameId,type,placementId}){
  const [rows]=await pool.query(`SELECT c.*,p.id campaign_id,p.name campaign_name FROM creatives c JOIN campaigns p ON p.id=c.campaign_id
   WHERE c.ad_type=? AND c.status='active' AND c.approval_status='approved'
   AND p.status='active' AND p.approval_status='approved'
   AND (p.game_id IS NULL OR p.game_id=?)
   AND (p.placement_id IS NULL OR p.placement_id='' OR p.placement_id=?)
   AND (p.starts_at IS NULL OR p.starts_at<=UTC_TIMESTAMP()) AND (p.ends_at IS NULL OR p.ends_at>=UTC_TIMESTAMP())
    ORDER BY p.weight DESC, RAND() LIMIT 20`,[type,gameId,placementId||'']);
  for(const ad of rows){
    if(ad.image_url&&!isHttpUrl(ad.image_url))continue;
    if(ad.click_url&&!isHttpUrl(ad.click_url))ad.click_url=null;
    return ad;
  }
  return null;
 }
}

function isHttpUrl(value){try{return ['http:','https:'].includes(new URL(value).protocol)}catch{return false}}

module.exports={DirectCampaignProvider,isHttpUrl};