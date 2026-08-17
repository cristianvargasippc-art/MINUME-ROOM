const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const db = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'admin12',
      database: 'minume_xvii'
    });

    const [rows] = await db.query('SELECT email, password FROM users WHERE email = ?', ['superadmin@minume-xvii.edu.do']);
    console.log(rows);

    if (!rows.length) {
      console.log('No user found');
      process.exit(0);
    }

    const ok = await bcrypt.compare('Minume2025!', rows[0].password);
    console.log('bcrypt ok', ok);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
