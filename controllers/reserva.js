import Reserva from "../models/reserva.js";
import nodemailer from "nodemailer";
import SalonEvento from "../models/salon_evento.js";
import Admin from "../models/administrador.js";

const httpReserva = {
  // Obtener todas las reservas
  getAll: async (req, res) => {
    try {
      const reservas = await Reserva.find()
        .populate({
          path: "idSalonEvento",
          populate: { path: "idContactoSalon" }
        });
      res.json(reservas);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Obtener una reserva por ID
  getPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findById(id).populate("idSalonEvento");
      if (!reserva)
        return res.status(404).json({ message: "Reserva no encontrada" });
      res.json(reserva);
    } catch (error) {
      res.status(400).json({ error });
    }
  },

  // Obtener reservas por nombre del cliente
  getPorNombreCliente: async (req, res) => {
    try {
      const { nombre_cliente } = req.params;
      const reservas = await Reserva.find({ nombre_cliente }).populate(
        "idSalonEvento"
      );
      res.json(reservas);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  //Redirigir a chat de WhatsApp
  contactanos: async (req, res) => {
    try {
      const administrador = await Admin.findOne();

      if (!administrador || !administrador.telefono) {
        return res.status(404).json({
          error: "No se encontró el administrador o su número de teléfono",
        });
      }

      const telefono = administrador.telefono.toString();
      if (!/^\d{10}$/.test(telefono)) {
        return res.status(400).json({
          error: "El número de teléfono del administrador no es válido",
        });
      }

      const numeroWhatsApp = `57${telefono}`;

      const mensajeWhatsApp =
        "¡Bienvenido a Esfera Audiovisual!\n\n" +
        "Estamos aquí para llevar tu salón de eventos a la vista de todos. " +
        "Nuestra web app te ayuda a promocionar tus espacios y eventos de manera fácil y efectiva.\n\n" +
        "¿Necesitas ayuda? Haz clic aquí para hablar con nuestro equipo de atención al cliente";

      const enlaceWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

      res.json({ link: enlaceWhatsApp });
    } catch (error) {
      res.status(500).json({
        error: "Ocurrió un error en el servidor. Por favor, intenta de nuevo.",
        details: error.message
      });
    }
  },


  // Registrar una nueva reserva y enviar correos
  registro: async (req, res) => {
    try {
      const {
        nombre_cliente,
        correo_cliente,
        telefono_cliente,
        cant_pers_res,
        fecha_res,
        mensaje_res,
        idSalonEvento,
      } = req.body;

      // Verificar si ya existe una reserva con el correo del cliente para el mismo salón y fecha
      const reservaExistente = await Reserva.findOne({
        correo_cliente,
        idSalonEvento,
      });

      let reserva;

      if (reservaExistente) {
        // Si la reserva ya existe, actualizarla con la nueva información
        reservaExistente.nombre_cliente = nombre_cliente;
        reservaExistente.telefono_cliente = telefono_cliente;
        reservaExistente.cant_pers_res = cant_pers_res;
        reservaExistente.fecha_res = fecha_res;
        reservaExistente.mensaje_res = mensaje_res;

        // Guardar los cambios
        reserva = await reservaExistente.save();
        console.log("Reserva actualizada:", reserva);
      } else {
        // Si no existe, crear una nueva reserva
        reserva = new Reserva({
          nombre_cliente,
          correo_cliente,
          telefono_cliente,
          cant_pers_res,
          fecha_res,
          mensaje_res,
          idSalonEvento,
        });

        await reserva.save();
        console.log("Nueva reserva creada:", reserva);
      }

      // Buscar el salón para obtener el correo del contacto asociado
      const salon = await SalonEvento.findById(idSalonEvento)
        .populate("idContactoSalon")
        .populate({
          path: "idCiudSalonEvento",
          populate: { path: "idDepart" },
        });

      // Verificar si el salón fue encontrado correctamente
      if (!salon || !salon.idContactoSalon) {
        return res
          .status(404)
          .json({ error: "No se encontró el salón o su contacto" });
      }

      const admin = await Admin.findOne();

      if (!admin) {
        return res
          .status(404)
          .json({ error: "No se encontró el administrador" });
      }

      const correoContactoSalon = salon.idContactoSalon.correo_cont;
      const correoAdmin = admin.correo;

      // Configurar el transporte de nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.userEmail,
          pass: process.env.password,
        },
      });

      const fechaResParsed = new Date(fecha_res + 'T00:00:00');  // Forzamos el tiempo a medianoche local
      const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(fechaResParsed);

      // Correo del cliente
      const enviarCorreoCliente = {
        from: process.env.userEmail,
        to: correo_cliente,
        subject: "Solicitud de reserva para salón de evento",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
              <div style="flex-grow: 1;">
                <h2 style="color: #E53935;">
                  ${salon.nombre_sal}
                </h2>
                <p style="font-size: 14px;color: #000000;font-weight: bold">${salon.idCiudSalonEvento.nombre_ciud
          }, ${salon.idCiudSalonEvento.idDepart.nombre_depart}</p>
                <p>Dirección: ${salon.direccion_sal}</p>
                <p>Teléfono: ${salon.idContactoSalon.telefono_cont}</p>
                ${salon.idContactoSalon.telefono_whats ? `<p>WhatsApp: ${salon.idContactoSalon.telefono_whats}</p>` : ""}
              </div>
              <div style="margin-left: 50px;">
                <img src="${salon.galeria_sal[0]?.url
          }" alt="Imagen del salón" style="width: 150px; height: auto; border-radius: 8px; object-fit: cover;" />
              </div>
            </div>
      
            <h3>Tu solicitud <span style="float: right; font-size: 14px;">Enviada el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></h3>
      
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Nombre:</strong> ${nombre_cliente}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Correo:</strong> ${correo_cliente}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Fecha Evento:</strong> ${fechaFormateada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Teléfono:</strong> ${telefono_cliente}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>N.º invitados:</strong> ${cant_pers_res}</td>
              </tr>
            </table>
          </div>
        `,
      };

      // Correo del contacto del salón
      const enviarCorreoContactoSalon = {
        from: process.env.userEmail,
        to: correoContactoSalon,
        subject: "Nueva reserva confirmada - Esfera Audiovisual",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
              <div style="flex-grow: 1;">
                <h2 style="color: #E53935;">
                  Nueva reserva confirmada para el salón ${salon.nombre_sal}
                </h2>
                <p style="font-size: 14px;color: #000000;font-weight: bold">${salon.idCiudSalonEvento.nombre_ciud
          }, ${salon.idCiudSalonEvento.idDepart.nombre_depart}</p>
                <p>Dirección: ${salon.direccion_sal}</p>
                <p>Teléfono: ${salon.idContactoSalon.telefono_cont}</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${salon.galeria_sal[0]?.url
          }" alt="Imagen del salón" style="width: 150px; height: auto; border-radius: 8px; object-fit: cover;" />
              </div>
            </div>
      
            <h3>Detalles de la reserva <span style="float: right; font-size: 14px;">Enviada el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></h3>
      
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Cliente:</strong> ${nombre_cliente}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>N.º Personas:</strong> ${cant_pers_res}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Fecha Evento:</strong> ${fechaFormateada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Teléfono Cliente:</strong> ${telefono_cliente}</td>
              </tr>
               <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Correo Cliente:</strong> ${correo_cliente}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mensaje Cliente:</strong> ${mensaje_res}</td>
              </tr>
            </table>
          </div>
        `,
      };

      // Correo del administrador
      const enviarCorreoAdmin = {
        from: process.env.userEmail,
        to: correoAdmin,
        subject: `Nueva reserva confirmada - ${salon.nombre_sal} - Esfera Audiovisual`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
              <div style="flex-grow: 1;">
                <h2 style="color: #E53935;">
                  Nueva reserva confirmada para el salón ${salon.nombre_sal}
                </h2>
                <p style="font-size: 14px;color: #000000;font-weight: bold">${salon.idCiudSalonEvento.nombre_ciud
          }, ${salon.idCiudSalonEvento.idDepart.nombre_depart}</p>
                <p><strong>Dirección Salón:</strong> ${salon.direccion_sal}</p>
                <p><strong>Teléfono Salón:</strong> ${salon.idContactoSalon.telefono_cont}</p>
                <p><strong>Correo Salón:</strong> ${salon.idContactoSalon.correo_cont}</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${salon.galeria_sal[0]?.url
          }" alt="Imagen del salón" style="width: 150px; height: auto; border-radius: 8px; object-fit: cover;" />
              </div>
            </div>
      
            <h3>Detalles de la reserva <span style="float: right; font-size: 14px;">Enviada el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></h3>
      
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Cliente:</strong> ${nombre_cliente}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>N.º Personas:</strong> ${cant_pers_res}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Fecha Evento:</strong> ${fechaFormateada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Teléfono Cliente:</strong> ${telefono_cliente}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Correo Cliente:</strong> ${correo_cliente}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mensaje:</strong> ${mensaje_res}</td>
              </tr>
            </table>
          </div>
        `,
      };

      // Enviar ambos correos de forma asíncrona
      await Promise.all([
        transporter.sendMail(enviarCorreoCliente),
        transporter.sendMail(enviarCorreoContactoSalon),
        transporter.sendMail(enviarCorreoAdmin),
      ]);

      res.json(reserva);
    } catch (error) {
      console.error("Error en el proceso de reserva: ", error);
      res.status(500).json({ error: error.message });
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
        idSalonEvento,
      } = req.body;

      // Actualizar la reserva
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
      ).populate("idSalonEvento");

      if (!reserva) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      // Buscar el salón de eventos para obtener los detalles del contacto y la ubicación
      const salon = await SalonEvento.findById(idSalonEvento)
        .populate("idContactoSalon")
        .populate({
          path: "idCiudSalonEvento",
          populate: { path: "idDepart" },
        });

      // Verificar si el salón fue encontrado correctamente
      if (!salon || !salon.idContactoSalon) {
        return res.status(404).json({ error: "No se encontró el salón o su contacto" });
      }

      const admin = await Admin.findOne().sort({ createdAt: 1 });

      if (!admin) {
        return res.status(404).json({ error: "No se encontró el administrador" });
      }

      const correoContactoSalon = salon.idContactoSalon.correo_cont;
      const correoAdmin = admin.correo;

      // Configurar el transporte de nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.userEmail,
          pass: process.env.password,
        },
      });

      const fechaResParsed = new Date(fecha_res + 'T00:00:00');  // Forzamos el tiempo a medianoche local
      const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(fechaResParsed);


      // Correo del cliente
      const enviarCorreoCliente = {
        from: process.env.userEmail,
        to: correo_cliente,
        subject: "Actualización de reserva para salón de evento",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
              <div style="flex-grow: 1;">
                <h2 style="color: #E53935;">
                  ${salon.nombre_sal}
                </h2>
                <p style="font-size: 14px;color: #000000;font-weight: bold">${salon.idCiudSalonEvento.nombre_ciud}, ${salon.idCiudSalonEvento.idDepart.nombre_depart}</p>
                <p>Dirección: ${salon.direccion_sal}</p>
                <p>Teléfono: ${salon.idContactoSalon.telefono_cont}</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${salon.galeria_sal[0]?.url}" alt="Imagen del salón" style="width: 150px; height: auto; border-radius: 8px; object-fit: cover;" />
              </div>
            </div>
  
            <h3>Tu reserva ha sido actualizada <span style="float: right; font-size: 14px;">Actualizada el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></h3>
  
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Nombre:</strong> ${nombre_cliente}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Correo:</strong> ${correo_cliente}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Fecha Evento:</strong> ${fechaFormateada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Teléfono:</strong> ${telefono_cliente}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>N.º invitados:</strong> ${cant_pers_res}</td>
              </tr>
            </table>
          </div>
        `,
      };

      // Correo del contacto del salón
      const enviarCorreoContactoSalon = {
        from: process.env.userEmail,
        to: correoContactoSalon,
        subject: "Actualización de reserva confirmada - Esfera Audiovisual",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
              <div style="flex-grow: 1;">
                <h2 style="color: #E53935;">
                  Actualización de reserva confirmada para el salón ${salon.nombre_sal}
                </h2>
                <p style="font-size: 14px;color: #000000;font-weight: bold">${salon.idCiudSalonEvento.nombre_ciud}, ${salon.idCiudSalonEvento.idDepart.nombre_depart}</p>
                <p>Dirección: ${salon.direccion_sal}</p>
                <p>Teléfono: ${salon.idContactoSalon.telefono_cont}</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${salon.galeria_sal[0]?.url}" alt="Imagen del salón" style="width: 150px; height: auto; border-radius: 8px; object-fit: cover;" />
              </div>
            </div>
  
            <h3>Detalles de la actualización <span style="float: right; font-size: 14px;">Actualizada el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></h3>
  
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Cliente:</strong> ${nombre_cliente}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>N.º Personas:</strong> ${cant_pers_res}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Fecha Evento:</strong> ${fechaFormateada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Teléfono Cliente:</strong> ${telefono_cliente}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Correo Cliente:</strong> ${correo_cliente}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mensaje Cliente:</strong> ${mensaje_res}</td>
              </tr>
            </table>
          </div>
        `,
      };

      // Correo del administrador
      const enviarCorreoAdmin = {
        from: process.env.userEmail,
        to: correoAdmin,
        subject: `Actualización de reserva confirmada - ${salon.nombre_sal} - Esfera Audiovisual`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
              <div style="flex-grow: 1;">
                <h2 style="color: #E53935;">
                  Actualización de reserva confirmada para el salón ${salon.nombre_sal}
                </h2>
                <p style="font-size: 14px;color: #000000;font-weight: bold">${salon.idCiudSalonEvento.nombre_ciud}, ${salon.idCiudSalonEvento.idDepart.nombre_depart}</p>
                <p><strong>Dirección Salón:</strong> ${salon.direccion_sal}</p>
                <p><strong>Teléfono Salón:</strong> ${salon.idContactoSalon.telefono_cont}</p>
                <p><strong>Correo Salón:</strong> ${salon.idContactoSalon.correo_cont}</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${salon.galeria_sal[0]?.url}" alt="Imagen del salón" style="width: 150px; height: auto; border-radius: 8px; object-fit: cover;" />
              </div>
            </div>
  
            <h3>Detalles de la actualización <span style="float: right; font-size: 14px;">Actualizada el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></h3>
  
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Cliente:</strong> ${nombre_cliente}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>N.º Personas:</strong> ${cant_pers_res}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Fecha Evento:</strong> ${fechaFormateada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Teléfono Cliente:</strong> ${telefono_cliente}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Correo Cliente:</strong> ${correo_cliente}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mensaje:</strong> ${mensaje_res}</td>
              </tr>
            </table>
          </div>
        `,
      };

      // Enviar correos de forma asíncrona
      await Promise.all([
        transporter.sendMail(enviarCorreoCliente),
        transporter.sendMail(enviarCorreoContactoSalon),
        transporter.sendMail(enviarCorreoAdmin),
      ]);

      // Respuesta exitosa
      res.json(reserva);

    } catch (error) {
      console.error("Error en el proceso de edición de la reserva: ", error);
      res.status(500).json({ error: error.message });
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
      ).populate("idSalonEvento");
      if (!reserva)
        return res.status(404).json({ message: "Reserva no encontrada" });
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
      ).populate("idSalonEvento");
      if (!reserva)
        return res.status(404).json({ message: "Reserva no encontrada" });
      res.json(reserva);
    } catch (error) {
      res.status(500).json({ error });
    }
  },
};

export default httpReserva;
