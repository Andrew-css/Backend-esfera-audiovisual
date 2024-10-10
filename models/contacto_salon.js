import mongoose from "mongoose";

const contactoSalonSchema = new mongoose.Schema({
  nombre_cont: { type: String, required: true },
  correo_cont: { type: String, required: true },
  telefono_cont: { type: String, required: true },
  telefono_whats: { type: String },
  createdAt: { type: Date, default: Date.now },
  estado: { type: Boolean, default: 1 },
});

export default mongoose.model("ContactoSalon", contactoSalonSchema);
