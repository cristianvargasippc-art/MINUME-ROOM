import('./backend/src/server.js').catch((error) => {
  console.error('No se pudo cargar backend/src/server.js:', error);
  process.exit(1);
});
