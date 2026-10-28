import { matchedData } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { hashPassword, comparePassword } from "../helpers/bcrypt.helper.js";
import { generateToken } from "../helpers/jwt.helper.js";

// POST /api/auth/register - Registro de nuevo usuario con perfil embebido
export const register = async (req, res) => {
  try {
    const data = matchedData(req);

    // Hashear contraseña antes de almacenar
    data.password = await hashPassword(data.password);

    // Si no se especifica rol, asignar 'user' por defecto
    if (!data.role) {
      data.role = "user";
    }

    const newUser = await UserModel.create(data);

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: newUser,
    });
  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({
      message: "Error interno del servidor al registrar el usuario",
    });
  }
};

// POST /api/auth/login - Inicio de sesión con JWT enviado en cookie segura httpOnly
export const login = async (req, res) => {
  try {
    const { email, password } = matchedData(req);

    // Buscar al usuario activo por correo
    const user = await UserModel.findOne({ email, deletedAt: null });
    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas: usuario o contraseña incorrectos",
      });
    }

    // Verificar contraseña con bcrypt
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales inválidas: usuario o contraseña incorrectos",
      });
    }

    // Generar token JWT con información esencial
    const token = generateToken({
      id: user._id,
      username: user.username,
      role: user.role,
    });

    // Configurar cookie segura con httpOnly
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({
      message: "Error interno del servidor al iniciar sesión",
    });
  }
};

// GET /api/auth/profile - Obtener datos del perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    // req.user ya fue inyectado y verificado por authMiddleware
    return res.status(200).json({
      message: "Perfil de usuario obtenido con éxito",
      user: req.user,
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener el perfil",
    });
  }
};

// PUT /api/auth/profile - Actualizar el perfil embebido del usuario autenticado
export const updateProfile = async (req, res) => {
  try {
    const data = matchedData(req);

    // Buscar al usuario en la base de datos
    const user = await UserModel.findOne({ _id: req.user._id, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Actualizar campos del perfil embebido
    if (data.firstName) user.profile.firstName = data.firstName;
    if (data.lastName) user.profile.lastName = data.lastName;
    if (data.birthDate !== undefined) user.profile.birthDate = data.birthDate;
    if (data.phone !== undefined) user.profile.phone = data.phone;

    await user.save();

    return res.status(200).json({
      message: "Perfil embebido actualizado correctamente",
      user,
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    return res.status(500).json({
      message: "Error interno del servidor al actualizar el perfil",
    });
  }
};

// POST /api/auth/logout - Cerrar sesión limpiando la cookie de autenticación
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Sesión cerrada correctamente",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    return res.status(500).json({
      message: "Error interno del servidor al cerrar sesión",
    });
  }
};
