// Punto de entrada para Hostinger (que ejecuta `node index.js` por defecto).
// backend/src es ESM, por eso se carga con import() dinamico desde CommonJS.
import('./backend/src/server.js').catch((error) => {
  console.error('No se pudo cargar backend/src/server.js:', error);
  process.exit(1);
});
