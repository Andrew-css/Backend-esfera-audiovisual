import Administrador from "../models/administrador.js";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import { generarJWT } from "../middlewares/validar-jwt.js";

let codigoEnviado = {};

function generarNumeroAleatorio() {
  let numeroAleatorio = Math.floor(Math.random() * 1000000);
  let numero = numeroAleatorio.toString().padStart(6, "0");
  let fechaCreacion = new Date();

  codigoEnviado = { codigo: numero, fechaCreacion };

  return numero;
}

// Controlador de Administradores
const httpAdministrador = {
  // Obtener todos los administradores
  getAll: async (req, res) => {
    try {
      const administradores = await Administrador.find();
      res.json(administradores);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Registrar un nuevo administrador
  registroAdministrador: async (req, res) => {
    try {
      const { nombre, apellido, cedula, correo, telefono, password } = req.body;

      // Verifica si ya existe un administrador con el mismo correo o cédula
      const adminExist = await Administrador.findOne({ $or: [{ cedula }, { correo }] });
      if (adminExist) {
        return res.status(400).json({
          error: "Cédula o Correo ya están registrados",
        });
      }

      // Crea un nuevo administrador
      const admin = new Administrador({
        nombre,
        apellido,
        cedula,
        correo,
        telefono,
        password,
      });

      // Encripta la contraseña
      const salt = bcryptjs.genSaltSync();
      admin.password = bcryptjs.hashSync(password, salt);

      // Guarda el administrador en la base de datos
      await admin.save();

      res.json(admin);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Autenticación de administrador
  login: async (req, res) => {
    const { cedula, password } = req.body;

    try {
      const admin = await Administrador.findOne({ cedula });
      if (!admin) {
        return res.status(400).json({
          error: "Cédula o Contraseña incorrectos",
        });
      }
      if (admin.estado === false) {
        return res.status(400).json({
          error: "Administrador Inactivo",
        });
      }
      const validPassword = bcryptjs.compareSync(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({
          error: "Cédula o Contraseña incorrectos",
        });
      }
      const token = await generarJWT(admin.id);
      res.json({ admin, token });
    } catch (error) {
      return res.status(500).json({
        error: "Hable con el WebMaster",
      });
    }
  },

  // Editar administrador
  editarAdministrador: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, cedula, correo, telefono } = req.body;

      const administrador = await Administrador.findByIdAndUpdate(
        id,
        { nombre, apellido, cedula, correo, telefono },
        { new: true }
      );

      res.json(administrador);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  codigoRecuperar: async (req, res) => {
    try {
      const { correo } = req.params;

      const codigo = generarNumeroAleatorio();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.userEmail,
          pass: process.env.password,
        },
      });

      const mailOptions = {
        from: process.env.userEmail,
        to: correo,
        subject: "Recuperación de Contraseña",
        text: "Tu código para restablecer tu contraseña es: " + codigo,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            error: "Error al enviar el correo electrónico.",
          });
        } else {
          console.log("Correo electrónico enviado: " + info.response);
          res.json({
            success: true,
            msg: "Correo electrónico enviado con éxito.",
          });
        }
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({ error });
    }
  },

  confirmarCodigo: async (req, res) => {
    try {
      const { codigo } = req.params;

      if (!codigoEnviado) {
        return res.status(400).json({ error: "Código no generado" });
      }

      const { codigo: codigoGuardado, fechaCreacion } = codigoEnviado;
      const tiempoExpiracion = 30; // Tiempo de expiración en minutos

      const tiempoActual = new Date();
      const tiempoDiferencia = tiempoActual - new Date(fechaCreacion);
      const minutosDiferencia = tiempoDiferencia / (1000 * 60);

      if (minutosDiferencia > tiempoExpiracion) {
        return res.status(400).json({ error: "El código ha expirado" });
      }

      if (codigo == codigoGuardado) {
        return res.json({ msg: "Código correcto" });
      }

      return res.status(400).json({ error: "Código incorrecto" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error, hable con el WebMaster",
      });
    }
  },

  putCambioPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { password, newPassword } = req.body;
      const administrador = await Administrador.findById(id);

      if (!administrador) {
        return res.status(404).json({ error: "Administrador no encontrado" });
      }

      const passAnterior = administrador.password;

      const validPassword = bcryptjs.compareSync(
        String(password),
        String(passAnterior)
      );

      if (!validPassword) {
        return res.status(401).json({ error: "Contraseña actual incorrecta" });
      }

      const salt = bcryptjs.genSaltSync();
      const cryptNewPassword = bcryptjs.hashSync(newPassword, salt);

      await Administrador.findByIdAndUpdate(
        administrador.id,
        { password: cryptNewPassword },
        { new: true }
      );

      return res.status(200).json({ msg: "Contraseña actualizada con éxito" });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ msgError: "Error interno del servidor", error });
    }
  },

  nuevaPassword: async (req, res) => {
    try {
      const { codigo, password } = req.body;

      const { codigo: codigoGuardado, fechaCreacion } = codigoEnviado;
      const tiempoExpiracion = 30; // Tiempo de expiración en minutos

      const tiempoActual = new Date();
      const tiempoDiferencia = tiempoActual - new Date(fechaCreacion);
      const minutosDiferencia = tiempoDiferencia / (1000 * 60);

      if (minutosDiferencia > tiempoExpiracion) {
        return res.status(400).json({ error: "El código ha expirado" });
      }

      if (codigo == codigoGuardado) {
        codigoEnviado = {};

        const administrador = req.AdministradorUpdate;

        const salt = bcryptjs.genSaltSync();
        const newPassword = bcryptjs.hashSync(password, salt);

        await Administrador.findByIdAndUpdate(
          administrador.id,
          { password: newPassword },
          { new: true }
        );

        return res
          .status(200)
          .json({ msg: "Contraseña actualizada con éxito" });
      }

      return res.status(400).json({ error: "Código incorrecto" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error, hable con el WebMaster",
      });
    }
  },

  // Activar administrador
  activarAdministrador: async (req, res) => {
    try {
      const { id } = req.params;
      const administrador = await Administrador.findByIdAndUpdate(
        id,
        { estado: 1 },
        { new: true }
      );
      res.json(administrador);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Inactivar administrador
  inactivarAdministrador: async (req, res) => {
    try {
      const { id } = req.params;
      const administrador = await Administrador.findByIdAndUpdate(
        id,
        { estado: 0 },
        { new: true }
      );
      res.json(administrador);
    } catch (error) {
      res.status(500).json({ error });
    }
  },
};

export default httpAdministrador;
