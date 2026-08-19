#!/usr/bin/env node
/**
 * Genera contraseñas nuevas para las cuentas iniciales e imprime el SQL listo
 * para pegar en el editor de Supabase.
 *
 *   node database/generate_seed_passwords.js
 *
 * No escribe nada en disco ni acepta la contraseña por argumento (quedaría en
 * el historial del shell). Copia las contraseñas a un gestor de contraseñas en
 * cuanto las veas: no hay forma de recuperarlas después, solo de volver a rotar.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Mismo coste que usa la aplicación al registrar usuarios (routes/auth.js).
const BCRYPT_COST = 12;

// Hash bloqueado que trae el esquema: sirve para detectar cuentas sin rotar.
const HASH_BLOQUEADO = "$2a$12$tJkFFunbGtgnzgRtQEk4bedusrHJgUPMx7OrxXuoBKjU8CKuTbJpi";

const CUENTAS = [
  "superadmin@minume-xvii.edu.do",
  "secretaria@minume-xvii.edu.do",
  "mesa.educacion@minume-xvii.edu.do",
  "mesa.cooperacion@minume-xvii.edu.do",
  "delegado1@minume-xvii.edu.do",
  "delegado2@minume-xvii.edu.do",
];

// Sin caracteres ambiguos (O/0, l/1/I) para poder dictarlas sin errores.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%+=?";

const generarPassword = (longitud = 20) =>
  Array.from({ length: longitud }, () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join("");

const filas = CUENTAS.map((email) => {
  const password = generarPassword();
  return { email, password, hash: bcrypt.hashSync(password, BCRYPT_COST) };
});

const ancho = Math.max(...filas.map((f) => f.email.length));

console.log("");
console.log("=== GUARDA ESTO EN UN GESTOR DE CONTRASEÑAS (no se puede recuperar) ===");
console.log("");
filas.forEach((f) => console.log("  " + f.email.padEnd(ancho) + "  " + f.password));

console.log("");
console.log("=== SQL: pégalo en Supabase > SQL Editor y ejecútalo ===");
console.log("");
filas.forEach((f) => {
  console.log("UPDATE users SET password = " + "'" + f.hash + "'" + " WHERE email = " + "'" + f.email + "'" + ";");
});

console.log("");
console.log("-- Comprobación: debe devolver 0 filas (ninguna cuenta sin rotar).");
console.log("SELECT email FROM users WHERE password = " + "'" + HASH_BLOQUEADO + "'" + ";");
console.log("");