const crypto=require('crypto'); const pool=require('../config/db'); const {getBaseUrl}=require('../utils/http'); const {signTracking}=require('../utils/security'); const {getAdProvider}=require('../providers');
const TYPES=['banner','interstitial','rewarded'];
function validType(t){return TYPES.includes(t)}
async function nextAd({gameId,type,placementId}){
 const r=await getAdProvider().findAd({gameId,type,placementId});
 if(!r)return null;
 const [request]=await pool.query("INSERT INTO ad_requests (game_id,creative_id,placement_id,ad_type) VALUES (?,?,?,?)",[gameId,r.id,placementId||null,type]);
 await pool.query("INSERT INTO ad_events (creative_id,game_id,event_type,event_name,payload) VALUES (?,?,?,?,?)",[r.id,gameId,'sdk_event','served',JSON.stringify({requestId:String(request.insertId),type})]);
 const token=signTracking({rid:request.insertId,cid:r.id,gid:gameId,type}); const base=getBaseUrl();
 return {id:String(r.id),type:r.ad_type,title:r.title||undefined,body:r.body||undefined,imageUrl:r.image_url||undefined,html:r.html_creative||undefined,clickUrl:r.click_url||undefined,
  impressionUrl:`${base}/v1/track/${r.id}/impression?token=${encodeURIComponent(token)}`,
  clickTrackerUrl:`${base}/v1/track/${r.id}/click?token=${encodeURIComponent(token)}`,
  closeUrl:`${base}/v1/track/${r.id}/close?token=${encodeURIComponent(token)}`,
  trackingToken:token,requestId:String(request.insertId),closeable:true,
  reward:r.reward_amount!==null?{amount:Number(r.reward_amount),currency:r.reward_currency||undefined,name:r.reward_name||undefined}:undefined};
}
module.exports={nextAd,validType};
