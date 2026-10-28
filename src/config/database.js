import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/db_eventos_tpi3";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectado correctamente en: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error al conectar con la base de datos MongoDB:", error.message);
    process.exit(1);
  }
};
