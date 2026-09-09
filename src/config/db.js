const mysql = require('mysql2/promise');
const pool = mysql.createPool({
 host: process.env.DB_HOST || '127.0.0.1', port:Number(process.env.DB_PORT||3306),
 database:process.env.DB_NAME||'gamehub_ads', user:process.env.DB_USER||'root', password:process.env.DB_PASSWORD||'',
 waitForConnections:true, connectionLimit:20, queueLimit:0, dateStrings:true
});
module.exports=pool;
