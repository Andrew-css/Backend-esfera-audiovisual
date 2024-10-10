import mongoose from "mongoose";

const salonEventoSchema = new mongoose.Schema({
    nombre_sal: { type: String, required: true },
    descripcion_sal: { type: String, required: true },
    galeria_sal: [{ url: { type: String }, publicId: { type: String } }],
    capacidad_min: { type: Number, required: true },  
    capacidad_max: { type: Number, required: true }, 
    direccion_sal: { type: String, required: true },
    precio_sal: { type: Number, required: true },
    latitud: { type: String, required: true },
    longitud: { type: String, required: true },
    video360: { type: String },
    video_sal: { type: String },
    idCiudSalonEvento: { type: mongoose.Schema.Types.ObjectId, ref: "CiudadSalonEvento", required: true },
    idContactoSalon: { type: mongoose.Schema.Types.ObjectId, ref: "ContactoSalon", required: true },
    idAmbienteSalon: [{ type: mongoose.Schema.Types.ObjectId, ref: "AmbienteSalon", required: true }],
    idEspaciosSalon: [{ type: mongoose.Schema.Types.ObjectId, ref: "EspacioSalon", required: true }],
    idServiciosSalon: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServicioSalon", required: true }],
    idTipoSalon: [{ type: mongoose.Schema.Types.ObjectId, ref: "TipoSalon", required: true }],
    idUbicacionSalon: [{ type: mongoose.Schema.Types.ObjectId, ref: "UbicacionSalon", required: true }],
    createdAt: { type: Date, default: Date.now },
    estado: { type: Boolean, default: 1 }
});

export default mongoose.model("SalonEvento", salonEventoSchema);
