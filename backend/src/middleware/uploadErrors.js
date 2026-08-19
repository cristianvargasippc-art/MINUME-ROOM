import multer from "multer";

// multer entrega sus fallos como error de middleware. Sin un manejador en la
// cadena de la ruta terminaban en el errorHandler global, que responde 500 a lo
// que en realidad son errores del cliente (archivo muy grande o no admitido).
//
// Los errores propios de un fileFilter viajan con .status para poder devolver
// el código adecuado sin acoplar este módulo a cada ruta.
export const uploadErrorHandler = (messages = {}) => (error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    const defaults = {
      LIMIT_FILE_SIZE: "El archivo supera el tamaño permitido",
      LIMIT_FILE_COUNT: "Envía un solo archivo",
      LIMIT_UNEXPECTED_FILE: "Campo de archivo inesperado",
    };

    return res
      .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
      .json({ error: messages[error.code] || defaults[error.code] || "No se pudo procesar el archivo" });
  }

  if (error?.status) {
    return res.status(error.status).json({ error: error.message });
  }

  return next(error);
};

export default uploadErrorHandler;
