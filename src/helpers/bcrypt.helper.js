import bcrypt from "bcrypt";

// Hashear contraseña con bcrypt
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Comparar contraseña en texto plano con el hash
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
