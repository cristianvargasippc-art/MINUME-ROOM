export const errorHandler = (error, _req, res, _next) => {
  console.error(error);

  if (res.headersSent) {
    return;
  }

  return res.status(500).json({
    error: "Ha ocurrido un error interno del servidor",
  });
};

export default errorHandler;