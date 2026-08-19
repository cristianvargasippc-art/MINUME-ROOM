
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
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_commission_id ON users(commission_id);


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
);


CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  assignment_id VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('TAS-01', 'TAS-02', 'TAS-03', 'TAS-04', 'TAS-05')),
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  expected_product VARCHAR(20) DEFAULT 'PDF' CHECK (expected_product IN ('PDF', 'Presentacion', 'Planilla')),
  deadline TIMESTAMP NOT NULL,
  evaluation_criteria TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Asignada', 'En Progreso', 'Entregada', 'En Validacion', 'Evaluada', 'Rechazada', 'Vencida', 'Validada')),
  created_by INT NOT NULL,
  commission_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  assigned_to INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_commission_id ON assignments(commission_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);


CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL,
  submitted_by INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  status VARCHAR(20) DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Entregada', 'En Evaluacion', 'Evaluada', 'En Validacion', 'Validada', 'Rechazada', 'Vencida')),
  submitted_at TIMESTAMP DEFAULT NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);


CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL,
  evaluated_by INT NOT NULL,
  alignment_score INT NOT NULL CHECK (alignment_score BETWEEN 1 AND 4),
  argument_score INT NOT NULL CHECK (argument_score BETWEEN 1 AND 4),
  structure_score INT NOT NULL CHECK (structure_score BETWEEN 1 AND 4),
  originality_score INT NOT NULL CHECK (originality_score BETWEEN 1 AND 4),
  writing_score INT NOT NULL CHECK (writing_score BETWEEN 1 AND 4),
  total_score DECIMAL(4,2) NOT NULL,
  verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('Aprobado', 'En Correccion', 'Rechazado')),
  strengths TEXT NOT NULL,
  improvements TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  correction_deadline TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_submission_id ON evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluated_by ON evaluations(evaluated_by);


CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);


CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  recipient_role VARCHAR(20) NOT NULL CHECK (recipient_role IN ('superadmin', 'secretaria', 'mesa', 'delegado', 'all')),
  related_entity_type VARCHAR(50) NOT NULL,
  related_entity_id VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_alerts_recipient_role ON alerts(recipient_role);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);



INSERT INTO commissions (id, name, code, section, chair_name, description, theme, status, created_by) VALUES
(1, 'Comisión de Educación', 'EDU-MINUME', 'Aula 01', 'Mesa Directiva de Educación', 'Espacio para debate, seguimiento y entregas de la Comisión de Educación.', 'sunrise', 'Activa', 1),
(2, 'Comisión de Cooperación', 'COOP-MINUME', 'Aula 02', 'Mesa Directiva de Cooperación', 'Espacio para acuerdos, tareas y organización de la Comisión de Cooperación.', 'ocean', 'Activa', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  section = EXCLUDED.section,
  chair_name = EXCLUDED.chair_name,
  description = EXCLUDED.description,
  theme = EXCLUDED.theme;

INSERT INTO users (email, password, full_name, role, is_active) VALUES
('superadmin@minume-xvii.edu.do', '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi', 'Superadmin MINUME XVII', 'superadmin', TRUE),
('secretaria@minume-xvii.edu.do', '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi', 'Secretaria de Control y Calidad', 'secretaria', TRUE),
('mesa.educacion@minume-xvii.edu.do', '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi', 'Mesa Directiva - Educación', 'mesa', TRUE),
('mesa.cooperacion@minume-xvii.edu.do', '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi', 'Mesa Directiva - Cooperación', 'mesa', TRUE),
('delegado1@minume-xvii.edu.do', '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi', 'Ana María López', 'delegado', TRUE),
('delegado2@minume-xvii.edu.do', '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi', 'Carlos Pérez', 'delegado', TRUE)
ON CONFLICT (email) DO NOTHING;


UPDATE users SET commission_id = 1 WHERE email = 'mesa.educacion@minume-xvii.edu.do';
UPDATE users SET commission_id = 2 WHERE email = 'mesa.cooperacion@minume-xvii.edu.do';
UPDATE users SET commission_id = 1 WHERE email = 'delegado1@minume-xvii.edu.do';
UPDATE users SET commission_id = 1 WHERE email = 'delegado2@minume-xvii.edu.do';

SELECT 'users' as tabla, count(*) as registros FROM users
UNION ALL SELECT 'commissions', count(*) FROM commissions
UNION ALL SELECT 'assignments', count(*) FROM assignments
UNION ALL SELECT 'submissions', count(*) FROM submissions
UNION ALL SELECT 'evaluations', count(*) FROM evaluations
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'alerts', count(*) FROM alerts;