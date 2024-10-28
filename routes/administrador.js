import { Router } from "express";
import httpAdministrador from "../controllers/administrador.js";
import { check } from "express-validator";
import validarCampos from "../middlewares/validar.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import helpersAdministrador from "../helpers/administrador.js"; // Asumiendo que necesitas un archivo similar para validaciones
import helpersUsuario from "../helpers/usuario.js";

const router = new Router();

// Obtener todos los administradores
router.get(
  "/all",
  validarJWT, // Protege esta ruta para que solo usuarios autenticados puedan acceder
  httpAdministrador.getAll
);

router.get(
  "/codigo-recuperar/:correo",
  [
    check("correo", "Por favor ingrese el correo").not().isEmpty(),
    check("correo").custom(helpersUsuario.existeCorreo),
    validarCampos,
  ],
  httpAdministrador.codigoRecuperar
);

router.get("/confirmar-codigo/:codigo", [
  check('codigo', 'Ingrese el código').not().isEmpty(),
  validarCampos
], httpAdministrador.confirmarCodigo);

// Registrar un nuevo administrador
router.post(
  "/registro",
  [
    check("nombre", "Digite el nombre").not().isEmpty(),
    check("apellido", "Digite el apellido").not().isEmpty(),
    check("cedula", "Digite la cédula").not().isEmpty(),
    check("cedula").custom(helpersAdministrador.existeCedula), // Asume que existe un helper para cédulas
    check("correo", "Digite el correo").not().isEmpty(),
    check("correo", "Dirección de correo no válida").isEmail(),
    check("correo").custom(helpersAdministrador.existeCorreo), // Asume que existe un helper para correos
    check("telefono", "Digite el teléfono").not().isEmpty(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    // Aquí podrías agregar validaciones para la contraseña si es necesario
    validarCampos,
  ],
  httpAdministrador.registroAdministrador
);

router.put(
  "/cambioPassword/:id",
  [
    validarJWT,
    check("id", "Digite el id").not().isEmpty(),
    check("id", "No es mongo id").isMongoId(),
    check("password", "Digite la contraseña").not().isEmpty(),
    check("newPassword", "Digite la nueva contraseña").not().isEmpty(),
    check(
      "newPassword",
      "La contraseña debe contener al menos 1 mayúscula, 1 minúscula, al menos 2 números y un carácter especial"
    ).custom(helpersUsuario.validarPassword),
  ],
  httpAdministrador.putCambioPassword
);

router.put("/nueva-password", [
  check("correo", "Por favor ingrese el correo").not().isEmpty(),
  check("correo").custom(helpersUsuario.existeCorreoNewPass),
  check('codigo', 'Ingrese el código').not().isEmpty(),
  check('password', 'Ingrese la password').not().isEmpty(),
  check(
    "password",
    "La contraseña debe contener al menos 1 mayúscula, 1 minúscula, al menos 2 números y un carácter especial"
  ).custom(helpersUsuario.validarPassword),
  validarCampos,
], httpAdministrador.nuevaPassword);


// Autenticación de administrador
router.post(
  "/login",
  [
    check("cedula", "Digite la cédula").not().isEmpty(),
    check("password", "Digite la contraseña").not().isEmpty(),
    validarCampos,
  ],
  httpAdministrador.login
);

// Editar administrador
router.put(
  "/editar/:id",
  [
    validarJWT, // Protege esta ruta para que solo usuarios autenticados puedan acceder
    check("id", "Ingrese una ID válida").isMongoId(),
    check("nombre", "Digite el nombre").not().isEmpty(),
    check("apellido", "Digite el apellido").not().isEmpty(),
    check("cedula", "Digite la cédula").not().isEmpty(),
    check("correo", "Digite el correo").not().isEmpty(),
    check("correo", "Dirección de correo no válida").isEmail(),
    check("telefono", "Digite el teléfono").not().isEmpty(),
    validarCampos,
  ],
  httpAdministrador.editarAdministrador
);

// Activar administrador
router.put(
  "/activar/:id",
  [
    validarJWT, // Protege esta ruta para que solo usuarios autenticados puedan acceder
    check("id", "Ingrese una ID válida").isMongoId(),
    validarCampos,
  ],
  httpAdministrador.activarAdministrador
);

// Inactivar administrador
router.put(
  "/inactivar/:id",
  [
    validarJWT, // Protege esta ruta para que solo usuarios autenticados puedan acceder
    check("id", "Ingrese una ID válida").isMongoId(),
    validarCampos,
  ],
  httpAdministrador.inactivarAdministrador
);

export default router;
