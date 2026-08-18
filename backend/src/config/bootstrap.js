import { db } from "../db.js";

const seedCommissions = [
  { id: 1, name: "Comisión de Educación", code: "EDU-MINUME", section: "Aula 01", chair_name: "Mesa Directiva de Educación", description: "Espacio para debate, seguimiento y entregas de la Comisión de Educación.", theme: "sunrise" },
  { id: 2, name: "Comisión de Cooperación", code: "COOP-MINUME", section: "Aula 02", chair_name: "Mesa Directiva de Cooperación", description: "Espacio para acuerdos, tareas y organización de la Comisión de Cooperación.", theme: "ocean" },
];

export const bootstrapDatabase = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'secretaria', 'mesa', 'delegado')),
      commission_id INT DEFAULT NULL,
      profile_image_url VARCHAR(500) DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const profileImageExists = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_image_url'
  `);

  if (!profileImageExists.rows.length) {
    await db.query("ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) DEFAULT NULL");
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS commissions (
      id INT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      section VARCHAR(120) NOT NULL,
      chair_name VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      theme VARCHAR(20) DEFAULT 'sunrise' CHECK (theme IN ('sunrise', 'ocean', 'forest', 'ember')),
      status VARCHAR(20) DEFAULT 'Activa' CHECK (status IN ('Activa', 'Archivada')),
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const commission of seedCommissions) {
    await db.query(
      `INSERT INTO commissions (id, name, code, section, chair_name, description, theme, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Activa', 1)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, code = EXCLUDED.code, section = EXCLUDED.section,
         chair_name = EXCLUDED.chair_name, description = EXCLUDED.description, theme = EXCLUDED.theme`,
      [commission.id, commission.name, commission.code, commission.section, commission.chair_name, commission.description, commission.theme]
    );
  }
};