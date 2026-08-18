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
      id BIGSERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'secretaria', 'mesa', 'delegado')),
      commission_id BIGINT DEFAULT NULL,
      profile_image_url VARCHAR(500) DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const profileImageCheck = await db.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = current_schema() 
      AND table_name = 'users' 
      AND column_name = 'profile_image_url'
  `);

  if (profileImageCheck.rowCount === 0) {
    await db.query('ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) DEFAULT NULL');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS commissions (
      id BIGINT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      section VARCHAR(120) NOT NULL,
      chair_name VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      theme VARCHAR(50) DEFAULT 'sunrise' CHECK (theme IN ('sunrise', 'ocean', 'forest', 'ember')),
      status VARCHAR(50) DEFAULT 'Activa' CHECK (status IN ('Activa', 'Archivada')),
      created_by BIGINT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id BIGSERIAL PRIMARY KEY,
      assignment_id VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(120) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('TAS-01', 'TAS-02', 'TAS-03', 'TAS-04', 'TAS-05')),
      description TEXT NOT NULL,
      objective TEXT NOT NULL,
      expected_product VARCHAR(50) DEFAULT 'PDF' CHECK (expected_product IN ('PDF', 'Presentacion', 'Planilla')),
      deadline TIMESTAMP NOT NULL,
      evaluation_criteria TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Asignada', 'En Progreso', 'Entregada', 'En Validacion', 'Evaluada', 'Rechazada', 'Vencida', 'Validada')),
      created_by BIGINT NOT NULL,
      commission_id BIGINT NOT NULL,
      parent_id BIGINT DEFAULT NULL,
      assigned_to BIGINT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id BIGSERIAL PRIMARY KEY,
      assignment_id BIGINT NOT NULL,
      submitted_by BIGINT NOT NULL,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      status VARCHAR(50) DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Entregada', 'En Evaluacion', 'Evaluada', 'En Validacion', 'Validada', 'Rechazada', 'Vencida')),
      submitted_at TIMESTAMP DEFAULT NULL,
      version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id BIGSERIAL PRIMARY KEY,
      submission_id BIGINT NOT NULL,
      evaluated_by BIGINT NOT NULL,
      alignment_score INT NOT NULL CHECK (alignment_score BETWEEN 1 AND 4),
      argument_score INT NOT NULL CHECK (argument_score BETWEEN 1 AND 4),
      structure_score INT NOT NULL CHECK (structure_score BETWEEN 1 AND 4),
      originality_score INT NOT NULL CHECK (originality_score BETWEEN 1 AND 4),
      writing_score INT NOT NULL CHECK (writing_score BETWEEN 1 AND 4),
      total_score DECIMAL(4,2) NOT NULL,
      verdict VARCHAR(50) NOT NULL CHECK (verdict IN ('Aprobado', 'En Correccion', 'Rechazado')),
      strengths TEXT NOT NULL,
      improvements TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      correction_deadline TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
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
      id BIGSERIAL PRIMARY KEY,
      code VARCHAR(20) NOT NULL,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(50) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
      recipient_role VARCHAR(50) NOT NULL CHECK (recipient_role IN ('superadmin', 'secretaria', 'mesa', 'delegado', 'all')),
      related_entity_type VARCHAR(50) NOT NULL,
      related_entity_id VARCHAR(50) NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const commission of seedCommissions) {
    await db.query(
      `INSERT INTO commissions (id, name, code, section, chair_name, description, theme, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Activa', 1)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         section = EXCLUDED.section,
         chair_name = EXCLUDED.chair_name,
         description = EXCLUDED.description,
         theme = EXCLUDED.theme`,
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
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         commission_id = EXCLUDED.commission_id,
         password = COALESCE(users.password, EXCLUDED.password)`,
      [user.email, BCRYPT_PASSWORD, user.full_name, user.role, user.commission_id]
    );
  }
};

module.exports = {
  bootstrapDatabase
};