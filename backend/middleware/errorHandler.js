const errorHandler = (error, req, res, next) => {
  console.error(error);
 
  if (res.headersSent) {
    return next(error);
  }
 
  if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return res.status(400).json({ error: 'Solicitud inválida - JSON malformado' });
  }
 
  return res.status(500).json({
    error: error.message || 'Ha ocurrido un error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
  });
};
 
module.exports = errorHandler;
