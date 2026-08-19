-- ============================================================
-- MINUME XVII - Rotacion de contrasenas de las cuentas iniciales
-- ============================================================
--
-- Cuando usarlo:
--   1. Tras la primera instalacion, para dar de alta contrasenas reales.
--   2. URGENTE si alguna vez ejecutaste una version del esquema anterior a
--      esta limpieza: aquellas cuentas compartian el hash de una contrasena
--      publicada en el repositorio, incluida la de superadmin.
--
-- Como usarlo:
--   node database/generate_seed_passwords.js
--   El script imprime las contrasenas nuevas y las sentencias UPDATE ya
--   rellenadas. Pega esas sentencias aqui debajo o directamente en el editor
--   SQL de Supabase, y guarda las contrasenas en un gestor.
--
-- No pongas contrasenas ni hashes reales en este fichero: se versiona.
-- ============================================================


-- ---------- 1. Diagnostico: que cuentas siguen sin rotar ----------
-- El hash de abajo es el bloqueado que trae el esquema (nadie conoce su
-- preimagen). Las filas que devuelva esta consulta son cuentas que aun no
-- tienen contrasena utilizable.

SELECT id, email, role
FROM users
WHERE password = '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi'
ORDER BY id;


-- ---------- 2. Rotacion ----------
-- Pega aqui las sentencias UPDATE que imprime generate_seed_passwords.js.
-- Formato esperado (NO uses este hash de ejemplo, no sirve):
--
--   UPDATE users SET password = '<hash bcrypt coste 12>' WHERE email = '<correo>';


-- ---------- 3. Comprobacion final ----------
-- Debe devolver 0 filas: ninguna cuenta con el hash bloqueado.

SELECT COUNT(*) AS cuentas_sin_rotar
FROM users
WHERE password = '$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi';


-- ---------- 4. Opcional: desactivar las cuentas de prueba ----------
-- Si no vas a usar los delegados de ejemplo en produccion, desactivalos en
-- vez de rotarlos. La aplicacion rechaza el login de cuentas inactivas.
--
--   UPDATE users SET is_active = FALSE
--   WHERE email IN ('delegado1@minume-xvii.edu.do', 'delegado2@minume-xvii.edu.do');
