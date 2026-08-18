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
 
const seedUsers = [
  { email: 'superadmin@minume-xvii.edu.do', full_name: 'Superadmin MINUME XVII', role: 'superadmin', commission_id: null },
  { email: 'secretaria@minume-xvii.edu.do', full_name: 'Secretaria de Control y Calidad', role: 'secretaria', commission_id: null },
  { email: 'mesa.educacion@minume-xvii.edu.do', full_name: 'Mesa Directiva - Educación', role: 'mesa', commission_id: 1 },
  { email: 'mesa.cooperacion@minume-xvii.edu.do', full_name: 'Mesa Directiva - Cooperación', role: 'mesa', commission_id: 2 },
  { email: 'delegado1@minume-xvii.edu.do', full_name: 'Ana Maria Lopez', role: 'delegado', commission_id: 1 },
  { email: 'delegado2@minume-xvii.edu.do', full_name: 'Carlos Perez', role: 'delegado', commission_id: 1 }
];
 
const BCRYPT_PASSWORD = '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i';
 
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
 
  await db.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(120) NOT NULL,
      type ENUM('TAS-01', 'TAS-02', 'TAS-03', 'TAS-04', 'TAS-05') NOT NULL,
      description TEXT NOT NULL,
      objective TEXT NOT NULL,
      expected_product ENUM('PDF', 'Presentacion', 'Planilla') DEFAULT 'PDF',
      deadline DATETIME NOT NULL,
      evaluation_criteria TEXT NOT NULL,
      status ENUM('Borrador', 'Asignada', 'En Progreso', 'Entregada', 'En Validacion', 'Evaluada', 'Rechazada', 'Vencida', 'Validada') DEFAULT 'Borrador',
      created_by INT NOT NULL,
      commission_id INT NOT NULL,
      parent_id INT DEFAULT NULL,
      assigned_to INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
 
  await db.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id INT NOT NULL,
      submitted_by INT NOT NULL,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INT NOT NULL,
      status ENUM('Borrador', 'Entregada', 'En Evaluacion', 'Evaluada', 'En Validacion', 'Validada', 'Rechazada', 'Vencida') DEFAULT 'Borrador',
      submitted_at DATETIME DEFAULT NULL,
      version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
 
  await db.query(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      submission_id INT NOT NULL,
      evaluated_by INT NOT NULL,
      alignment_score INT NOT NULL,
      argument_score INT NOT NULL,
      structure_score INT NOT NULL,
      originality_score INT NOT NULL,
      writing_score INT NOT NULL,
      total_score DECIMAL(4,2) NOT NULL,
      verdict ENUM('Aprobado', 'En Correccion', 'Rechazado') NOT NULL,
      strengths TEXT NOT NULL,
      improvements TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      correction_deadline DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
 
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(50) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
 
  await db.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
      recipient_role ENUM('superadmin', 'secretaria', 'mesa', 'delegado', 'all') NOT NULL,
      related_entity_type VARCHAR(50) NOT NULL,
      related_entity_id VARCHAR(50) NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
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
 
  for (const user of seedUsers) {
    await db.query(
      `INSERT INTO users (email, password, full_name, role, commission_id, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         role = VALUES(role),
         commission_id = VALUES(commission_id),
         password = COALESCE(password, VALUES(password))`,
      [user.email, BCRYPT_PASSWORD, user.full_name, user.role, user.commission_id]
    );
  }
};
 
module.exports = {
  bootstrapDatabase
};
