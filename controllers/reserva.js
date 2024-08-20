import Reserva from "../models/reserva.js";

const httpReserva = {
  // Obtener todas las reservas
  getAll: async (req, res) => {
    try {
      const reservas = await Reserva.find().populate('idSalonEvento');
      res.json(reservas);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Obtener una reserva por ID
  getPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findById(id).populate('idSalonEvento');
      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });
      res.json(reserva);
    } catch (error) {
      res.status(400).json({ error });
    }
  },

  // Obtener reservas por nombre del cliente
  getPorNombreCliente: async (req, res) => {
    try {
      const { nombre_cliente } = req.params;
      const reservas = await Reserva.find({ nombre_cliente }).populate('idSalonEvento');
      res.json(reservas);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Registrar una nueva reserva
  registro: async (req, res) => {
    try {
      const {
        nombre_cliente,
        correo_cliente,
        telefono_cliente,
        cant_pers_res,
        fecha_res,
        mensaje_res,
        idSalonEvento
      } = req.body;

      const reserva = new Reserva({
        nombre_cliente,
        correo_cliente,
        telefono_cliente,
        cant_pers_res,
        fecha_res,
        mensaje_res,
        idSalonEvento,
      });

      await reserva.save();

      res.json(reserva);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Actualizar una reserva existente
  editar: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre_cliente,
        correo_cliente,
        telefono_cliente,
        cant_pers_res,
        fecha_res,
        mensaje_res,
        idSalonEvento
      } = req.body;

      const reserva = await Reserva.findByIdAndUpdate(
        id,
        {
          nombre_cliente,
          correo_cliente,
          telefono_cliente,
          cant_pers_res,
          fecha_res,
          mensaje_res,
          idSalonEvento,
        },
        { new: true }
      ).populate('idSalonEvento');

      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });

      res.json(reserva);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Activar una reserva
  putActivar: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findByIdAndUpdate(
        id,
        { estado: true },
        { new: true }
      ).populate('idSalonEvento');
      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });
      res.json(reserva);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Desactivar una reserva
  putInactivar: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findByIdAndUpdate(
        id,
        { estado: false },
        { new: true }
      ).populate('idSalonEvento');
      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });
      res.json(reserva);
    } catch (error) {
      res.status(500).json({ error });
    }
  },
};

export default httpReserva;
