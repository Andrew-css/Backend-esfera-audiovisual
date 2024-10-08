import { Router } from "express";
import httpReserva from "../controllers/reserva.js";
import { check } from "express-validator";
import validarCampos from "../middlewares/validar.js";

const router = new Router();

// Obtener todas las reservas
router.get(
  "/all",
  httpReserva.getAll
);

//Contactanos
router.get(
  "/contacto",
  httpReserva.contactanos
);

// Obtener una reserva por ID
router.get(
  "/:id",
  [
    check("id", "Ingrese una ID válida").isMongoId(),
    validarCampos,
  ],
  httpReserva.getPorId
);

// Obtener reservas por nombre del cliente
router.get(
  "/nombre-cliente/:nombre_cliente",
  httpReserva.getPorNombreCliente
);



// Registrar una nueva reserva
router.post(
  "/registro",
  [
    check("nombre_cliente", "Digite el nombre del cliente").not().isEmpty(),
    check("correo_cliente", "Ingrese un correo electrónico válido").isEmail(),
    check("telefono_cliente", "Ingrese un número de teléfono válido").isMobilePhone(),
    check("fecha_res", "Ingrese una fecha válida").isISO8601(),
    check("cant_pers_res", "Ingrese una cantidad de personas válida").not().isEmpty(),
    check("idSalonEvento", "Ingrese un ID de salón de evento válido").isMongoId(),
    validarCampos,
  ],
  httpReserva.registro
);

// Actualizar una reserva existente
router.put(
  "/editar/:id",
  [
    check("nombre_cliente", "Digite el nombre del cliente").not().isEmpty(),
    check("correo_cliente", "Ingrese un correo electrónico válido").isEmail(),
    check("telefono_cliente", "Ingrese un número de teléfono válido").isMobilePhone(),
    check("fecha_res", "Ingrese una fecha válida").isISO8601(),
    check("cant_pers_res", "Ingrese una cantidad de personas válida").not().isEmpty(),
    check("idSalonEvento", "Ingrese un ID de salón de evento válido").isMongoId(),
    validarCampos,
  ],
  httpReserva.editar
);

// Activar una reserva
router.put(
  "/activar/:id",
  [
    check("id", "Ingrese una ID válida").isMongoId(),
    validarCampos,
  ],
  httpReserva.putActivar
);

// Desactivar una reserva
router.put(
  "/inactivar/:id",
  [
    check("id", "Ingrese una ID válida").isMongoId(),
    validarCampos,
  ],
  httpReserva.putInactivar
);

export default router;
