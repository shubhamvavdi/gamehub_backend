function asyncHandler(fn){return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}
function getBaseUrl(){return (process.env.PUBLIC_BASE_URL||`http://localhost:${process.env.PORT||4000}`).replace(/\/$/,'')}
module.exports={asyncHandler,getBaseUrl};
