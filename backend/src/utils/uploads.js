import fs from "fs";
import path from "path";

// Borra un fichero subido que ya dejó de ser alcanzable desde la app (el avatar
// anterior, o la entrega sustituida por una nueva versión).
//
// Solo actúa sobre URLs propias con el prefijo esperado y exige que el resto sea
// un nombre plano, sin subcarpetas ni separadores: así un valor manipulado en
// base de datos no puede apuntar fuera del directorio ni cruzar entre carpetas
// (una URL de avatar nunca borrará un fichero de entregas, y viceversa).
//
// El fallo se ignora a propósito: limpiar disco no debe tumbar una petición que
// por lo demás terminó bien.
export const removeUploadedFile = (uploadDir, publicUrl, prefix) => {
  if (typeof publicUrl !== "string" || !publicUrl.startsWith(prefix)) {
    return;
  }

  const name = publicUrl.slice(prefix.length);

  if (!name || name !== path.basename(name)) {
    return;
  }

  fs.promises.unlink(path.join(uploadDir, name)).catch(() => {});
};

export default removeUploadedFile;
