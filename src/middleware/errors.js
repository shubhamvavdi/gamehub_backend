function notFound(req,res){res.status(404).json({ok:false,error:'Route not found'})}
function errorHandler(err,req,res,next){if(res.headersSent)return next(err);if(err?.type==='entity.parse.failed')return res.status(400).json({ok:false,error:'Invalid JSON body'});if(err?.code==='ER_DUP_ENTRY')return res.status(409).json({ok:false,error:'Duplicate resource'});console.error(err);res.status(500).json({ok:false,error:process.env.NODE_ENV==='production'?'Internal server error':err.message||'Internal server error'})}
module.exports={notFound,errorHandler};
