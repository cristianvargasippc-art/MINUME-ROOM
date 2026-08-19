import { randomInt } from "crypto";

// Sin caracteres ambiguos (O/0, l/1/I): estas contraseñas se dictan o se copian
// a mano al dar de alta a una integrante, y una confusión cuesta un soporte.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%+=?";

// Contraseña temporal de un solo uso para cuentas creadas por un responsable.
//
// Antes se insertaba una constante igual para todo el mundo, y además estaba
// escrita en el repositorio y en la propia interfaz: conocer el correo de
// alguien bastaba para entrar en su cuenta. Ahora cada alta recibe una distinta
// e impredecible, que solo se muestra una vez a quien crea la cuenta.
export const generateTemporaryPassword = (longitud = 16) =>
  Array.from({ length: longitud }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

export default generateTemporaryPassword;