CREATE DATABASE IF NOT EXISTS minume_xvii CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE minume_xvii;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'secretaria', 'mesa', 'delegado') NOT NULL,
  commission_id INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  evaluated_by INT NOT NULL,
  alignment_score INT NOT NULL CHECK (alignment_score BETWEEN 1 AND 4),
  argument_score INT NOT NULL CHECK (argument_score BETWEEN 1 AND 4),
  structure_score INT NOT NULL CHECK (structure_score BETWEEN 1 AND 4),
  originality_score INT NOT NULL CHECK (originality_score BETWEEN 1 AND 4),
  writing_score INT NOT NULL CHECK (writing_score BETWEEN 1 AND 4),
  total_score DECIMAL(4,2) NOT NULL,
  verdict ENUM('Aprobado', 'En Correccion', 'Rechazado') NOT NULL,
  strengths TEXT NOT NULL,
  improvements TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  correction_deadline DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

INSERT INTO users (email, password, full_name, role, is_active) VALUES
('superadmin@minume-xvii.edu.do', '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i', 'Superadmin MINUME XVII', 'superadmin', TRUE),
('secretaria@minume-xvii.edu.do', '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i', 'Secretaria de Control y Calidad', 'secretaria', TRUE),
('mesa.educacion@minume-xvii.edu.do', '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i', 'Mesa Directiva - Educacion', 'mesa', TRUE),
('mesa.cooperacion@minume-xvii.edu.do', '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i', 'Mesa Directiva - Cooperacion', 'mesa', TRUE),
('delegado1@minume-xvii.edu.do', '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i', 'Ana Maria Lopez', 'delegado', TRUE),
('delegado2@minume-xvii.edu.do', '$2a$12$TyswpA71t9/OiFwiAn40ieiwCVzXd9jsjs.HCBbqK2KuWLmgt9B8i', 'Carlos Perez', 'delegado', TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

UPDATE users SET commission_id = 1 WHERE email = 'mesa.educacion@minume-xvii.edu.do';
UPDATE users SET commission_id = 2 WHERE email = 'mesa.cooperacion@minume-xvii.edu.do';
UPDATE users SET commission_id = 1 WHERE email = 'delegado1@minume-xvii.edu.do';
UPDATE users SET commission_id = 1 WHERE email = 'delegado2@minume-xvii.edu.do';

INSERT INTO commissions (id, name, code, section, chair_name, description, theme, status, created_by) VALUES
(1, 'Comision de Educacion', 'EDU-MINUME', 'Aula 01', 'Mesa Directiva de Educacion', 'Espacio para debate, seguimiento y entregas de la comision de educacion.', 'sunrise', 'Activa', 1),
(2, 'Comision de Cooperacion', 'COOP-MINUME', 'Aula 02', 'Mesa Directiva de Cooperacion', 'Espacio para acuerdos, tareas y organizacion de la comision de cooperacion.', 'ocean', 'Activa', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  code = VALUES(code),
  section = VALUES(section),
  chair_name = VALUES(chair_name),
  description = VALUES(description),
  theme = VALUES(theme);
