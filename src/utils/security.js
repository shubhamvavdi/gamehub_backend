const crypto=require('crypto'); const jwt=require('jsonwebtoken');
function hash(value){return crypto.createHash('sha256').update(String(value)).digest('hex')}
function hashIp(req){return hash(req.ip||req.socket.remoteAddress||'unknown')}
function safeEqual(a,b){if(!a||!b)return false; const aa=Buffer.from(String(a));const bb=Buffer.from(String(b));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function signTracking(payload){return jwt.sign(payload,process.env.TRACKING_JWT_SECRET||process.env.ADMIN_API_KEY||'unsafe-dev-secret',{expiresIn:'10m'})}
function verifyTracking(token){return jwt.verify(token,process.env.TRACKING_JWT_SECRET||process.env.ADMIN_API_KEY||'unsafe-dev-secret')}
module.exports={hash,hashIp,safeEqual,signTracking,verifyTracking};
