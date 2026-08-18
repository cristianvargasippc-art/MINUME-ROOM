const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.RAILWAY_MYSQL_HOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.RAILWAY_MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER || process.env.RAILWAY_MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.RAILWAY_MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.RAILWAY_MYSQL_DATABASE || 'minume_xvii',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z'
};

const sslMode = (process.env.DB_SSL || '').toLowerCase();
if (sslMode === 'true' || sslMode === '1' || sslMode === 'required' || sslMode === 'require') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const db = mysql.createPool(dbConfig);

module.exports = db;
