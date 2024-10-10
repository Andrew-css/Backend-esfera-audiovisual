import ContactoSalon from "../models/contacto_salon.js";

const httpContactoSalon = {
  // Obtener todos los contactos de salón
  getAll: async (req, res) => {
    try {
      const contactosSalon = await ContactoSalon.find();
      res.json(contactosSalon);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Obtener un contacto de salón por ID
  getPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const contactoSalon = await ContactoSalon.findById(id);
      if (!contactoSalon) return res.status(404).json({ message: "ContactoSalon no encontrado" });
      res.json(contactoSalon);
    } catch (error) {
      res.status(400).json({ error });
    }
  },

  // Obtener contactos de salón por nombre
  getPorNombre: async (req, res) => {
    try {
      const { nombre } = req.params;
      const contactosSalon = await ContactoSalon.find({ nombre_cont: nombre });
      res.json(contactosSalon);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Registrar un nuevo contacto de salón
  registro: async (req, res) => {
    try {
      const { nombre_cont, correo_cont, telefono_cont, telefono_whats } = req.body;

      const contactoSalon = new ContactoSalon({
        nombre_cont,
        correo_cont,
        telefono_cont,
        telefono_whats,
      });

      await contactoSalon.save();

      res.json(contactoSalon);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Actualizar un contacto de salón existente
  editar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_cont, correo_cont, telefono_cont, telefono_whats } = req.body;

      const contactoSalon = await ContactoSalon.findByIdAndUpdate(
        id,
        {
          nombre_cont,
          correo_cont,
          telefono_cont,
          telefono_whats,
        },
        { new: true }
      );

      if (!contactoSalon) return res.status(404).json({ message: "Contacto salon no encontrado" });

      res.json(contactoSalon);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Activar un contacto de salón
  putActivar: async (req, res) => {
    try {
      const { id } = req.params;
      const contactoSalon = await ContactoSalon.findByIdAndUpdate(
        id,
        { estado: true },
        { new: true }
      );
      if (!contactoSalon) return res.status(404).json({ message: "Contacto salon no encontrado" });
      res.json(contactoSalon);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Desactivar un contacto de salón
  putInactivar: async (req, res) => {
    try {
      const { id } = req.params;
      const contactoSalon = await ContactoSalon.findByIdAndUpdate(
        id,
        { estado: false },
        { new: true }
      );
      if (!contactoSalon) return res.status(404).json({ message: "Contacto salon no encontrado" });
      res.json(contactoSalon);
    } catch (error) {
      res.status(500).json({ error });
    }
  },
};

export default httpContactoSalon;
