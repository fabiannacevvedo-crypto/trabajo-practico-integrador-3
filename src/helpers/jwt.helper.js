import jwt from "jsonwebtoken";

// Generar token JWT con payload y tiempo de expiración
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurada en las variables de entorno");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign(payload, secret, { expiresIn });
};

// Verificar token JWT y decodificar el payload
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurada en las variables de entorno");
  }

  return jwt.verify(token, secret);
};
