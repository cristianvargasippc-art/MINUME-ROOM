const db = require('./db');

const seedCommissions = [
  {
    id: 1,
    name: 'Comisión de Educación',
    code: 'EDU-MINUME',
    section: 'Aula 01',
    chair_name: 'Mesa Directiva de Educación',
    description: 'Espacio para debate, seguimiento y entregas de la Comisión de Educación.',
    theme: 'sunrise'
  },
  {
    id: 2,
    name: 'Comisión de Cooperación',
    code: 'COOP-MINUME',
    section: 'Aula 02',
    chair_name: 'Mesa Directiva de Cooperación',
    description: 'Espacio para acuerdos, tareas y organización de la Comisión de Cooperación.',
    theme: 'ocean'
  }
];

const bootstrapDatabase = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role ENUM('superadmin', 'secretaria', 'mesa', 'delegado') NOT NULL,
      commission_id INT DEFAULT NULL,
      profile_image_url VARCHAR(500) DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [profileImageColumns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'profile_image_url'`
  );

  if (!profileImageColumns.length) {
    await db.query('ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) DEFAULT NULL AFTER commission_id');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS commissions (
      id INT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      section VARCHAR(120) NOT NULL,
      chair_name VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      theme ENUM('sunrise', 'ocean', 'forest', 'ember') DEFAULT 'sunrise',
      status ENUM('Activa', 'Archivada') DEFAULT 'Activa',
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  for (const commission of seedCommissions) {
    await db.query(
      `INSERT INTO commissions (id, name, code, section, chair_name, description, theme, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Activa', 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         code = VALUES(code),
         section = VALUES(section),
         chair_name = VALUES(chair_name),
         description = VALUES(description),
         theme = VALUES(theme)`,
      [
        commission.id,
        commission.name,
        commission.code,
        commission.section,
        commission.chair_name,
        commission.description,
        commission.theme
      ]
    );
  }
};

module.exports = {
  bootstrapDatabase
};
