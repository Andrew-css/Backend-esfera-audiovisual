import SalonEvento from "../models/salon_evento.js";
import CiudadSalonEvento from "../models/ciudad_salon.js";
import Departamento from "../models/departamento_salon.js";
import DepartamentoSalonEvento from "../models/departamento_salon.js";

const httpSalonEvento = {
  // Obtener todos los salones de evento
  getAll: async (req, res) => {
    try {
      const salonEventos = await SalonEvento.find()
        .populate({
          path: "idCiudSalonEvento",
          populate: { path: "idDepart" },
        })
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");
      res.json(salonEventos);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Obtener salon por ID
  getPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const salonEvento = await SalonEvento.findById(id)
        .populate({
          path: "idCiudSalonEvento",
          populate: { path: "idDepart" },
        })
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");
      if (!salonEvento)
        return res.status(404).json({ message: "Salon no encontrado" });
      res.json(salonEvento);
    } catch (error) {
      res.status(400).json({ error });
    }
  },

  // Obtener salones por ciudad
  getPorCiudad: async (req, res) => {
    try {
      const { idCiudSalonEvento } = req.params;
      const salonEventos = await SalonEvento.find({ idCiudSalonEvento })
        .populate("idCiudSalonEvento")
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");
      res.json(salonEventos);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  getSalonesByLocation: async (req, res) => {
    try {
      const { location } = req.params; // `location` puede ser el nombre de la ciudad o departamento
      let filter = {};

      // Buscar por nombre de ciudad
      const ciudadDoc = await CiudadSalonEvento.findOne({
        nombre_ciud: location,
      });

      if (ciudadDoc) {
        // Si se encuentra la ciudad, se filtran los salones por esa ciudad
        filter.idCiudSalonEvento = ciudadDoc._id;
      } else {
        // Si no se encuentra la ciudad, buscar por nombre de departamento
        const departamentoDoc = await DepartamentoSalonEvento.findOne({
          nombre_depart: location,
        });

        if (departamentoDoc) {
          // Obtener todas las ciudades asociadas a ese departamento
          const ciudades = await CiudadSalonEvento.find({
            idDepart: departamentoDoc._id,
          });
          const ciudadIds = ciudades.map((c) => c._id);

          // Filtrar los salones que estén en cualquiera de esas ciudades
          filter.idCiudSalonEvento = { $in: ciudadIds };
        } else {
          // Si no se encuentra ni la ciudad ni el departamento, retornar un array vacío
          return res.status(200).json([]);
        }
      }

      // Filtrar salones basados en el filtro determinado
      const salones = await SalonEvento.find(filter)
        .populate("idCiudSalonEvento")
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");

      res.status(200).json(salones);
    } catch (error) {
      console.error("Error fetching salones by location:", error);
      res.status(500).json({ message: "Error fetching salones by location" });
    }
  },

  getFilteredSalones: async (req, res) => {
    try {
      const {
        idCiudSalonEvento,
        idAmbienteSalon,
        idEspaciosSalon,
        idServiciosSalon,
        idTipoSalon,
        idUbicacionSalon,
        precio_sal,
        capacidad_sal, // Este parámetro sigue viniendo como un rango, por ejemplo "100-199"
      } = req.query;

      let query = {};

      if (idCiudSalonEvento) {
        const ciudades = await CiudadSalonEvento.find({
          $or: [{ _id: idCiudSalonEvento }, { idDepart: idCiudSalonEvento }],
        }).select("_id");

        const ciudadIds = ciudades.map((ciudad) => ciudad._id);
        query.idCiudSalonEvento = { $in: ciudadIds };
      }

      if (idAmbienteSalon) {
        const ambienteSalonIds = idAmbienteSalon.split(",");
        query.idAmbienteSalon = { $all: ambienteSalonIds };
      }

      if (idEspaciosSalon) {
        const espaciosSalonIds = idEspaciosSalon.split(",");
        query.idEspaciosSalon = { $all: espaciosSalonIds };
      }

      if (idServiciosSalon) {
        const serviciosSalonIds = idServiciosSalon.split(",");
        query.idServiciosSalon = { $all: serviciosSalonIds };
      }

      if (idTipoSalon) {
        const tipoSalonIds = idTipoSalon.split(",");
        query.idTipoSalon = { $in: tipoSalonIds };
      }

      if (idUbicacionSalon) {
        const ubicacionSalonIds = idUbicacionSalon.split(",");
        query.idUbicacionSalon = { $in: ubicacionSalonIds };
      }

      if (precio_sal) {
        query.precio_sal = { $lte: precio_sal };
      }

      if (capacidad_sal) {
        const [capacidadMin, capacidadMax] = capacidad_sal
          .split("-")
          .map(Number);
        query.$and = [
          { capacidad_min: { $lte: capacidadMax } }, // capacidad_max >= capacidadMin
          { capacidad_max: { $gte: capacidadMin } }, // capacidad_min <= capacidadMax
        ];
      }

      const salones = await SalonEvento.find(query)
        .populate({
          path: "idCiudSalonEvento",
          populate: { path: "idDepart" },
        })
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon")
        .exec();

      res.status(200).json(salones);
    } catch (error) {
      res.status(500).json({ message: "Error al filtrar los salones", error });
    }
  },

  getSalonesDestacados: async (req, res) => {
    try {
      const salonesDestacados = await SalonEvento.find({
        posicion_banner: { $ne: null, $exists: true }, // Excluye nulos y campos inexistentes
      }).sort({ posicion_banner: 1 }); // Ordenar por la posición del banner

      res.status(200).json(salonesDestacados);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener salones destacados", error });
    }
  },

  getSalonesDestacadosByUbicacion: async (req, res) => {
    try {
      const salonesDestacados = await SalonEvento.find({
        posicion_banner_ubicacion: { $ne: null, $exists: true },
      })
        .sort({ posicion_banner_ubicacion: 1 })
        .populate({
          path: "idCiudSalonEvento",
          populate: { path: "idDepart" },
        });

      console.log(salonesDestacados); // Verifica los resultados
      res.status(200).json(salonesDestacados);
    } catch (error) {
      console.error("Error en populate:", error); // Imprime el error
      res.status(500).json({ message: "Error al obtener salones destacados por ubicación", error });
    }
  },


  // Registrar un nuevo salon de evento
  registro: async (req, res) => {
    try {
      const {
        nombre_sal,
        descripcion_sal,
        galeria_sal,
        tipo_sal,
        capacidad_min,
        capacidad_max,
        direccion_sal,
        precio_sal,
        longitud,
        latitud,
        video360,
        video_sal,
        idCiudSalonEvento,
        idContactoSalon,
        idAmbienteSalon,
        idEspaciosSalon,
        idServiciosSalon,
        idTipoSalon,
        idUbicacionSalon,
      } = req.body;

      const salonEvento = new SalonEvento({
        nombre_sal,
        descripcion_sal,
        galeria_sal,
        tipo_sal,
        capacidad_min,
        capacidad_max,
        direccion_sal,
        precio_sal,
        longitud,
        latitud,
        video360,
        video_sal,
        idCiudSalonEvento,
        idContactoSalon,
        idAmbienteSalon,
        idEspaciosSalon,
        idServiciosSalon,
        idTipoSalon,
        idUbicacionSalon,
      });

      await salonEvento.save();

      res.json(salonEvento);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Actualizar un salon existente
  editar: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre_sal,
        descripcion_sal,
        galeria_sal,
        tipo_sal,
        capacidad_min,
        capacidad_max,
        direccion_sal,
        precio_sal,
        longitud,
        latitud,
        video360,
        video_sal,
        idCiudSalonEvento,
        idContactoSalon,
        idAmbienteSalon,
        idEspaciosSalon,
        idServiciosSalon,
        idTipoSalon,
        idUbicacionSalon,
        posicion_banner,
        posicion_banner_ubicacion,
      } = req.body;

      // 1. Verificar si ya existe un salón con la misma posición de banner
      if (posicion_banner) {
        const salonConPosicion = await SalonEvento.findOne({
          posicion_banner,
          _id: { $ne: id }, // Excluir el salón actual
        });

        if (salonConPosicion) {
          return res.status(400).json({
            error: `El salón '${salonConPosicion.nombre_sal}' ya tiene la posición ${posicion_banner} en el banner. Por favor escoja otra diferente.`,
          });
        }
      }

      if (posicion_banner_ubicacion) {
        const salonPosicionUbicacion = await SalonEvento.findOne({
          posicion_banner_ubicacion,
          _id: { $ne: id }, // Excluir el salón actual
        });

        if (salonPosicionUbicacion) {
          return res.status(400).json({
            error: `El salón '${salonPosicionUbicacion.nombre_sal}' ya tiene la posición ${posicion_banner_ubicacion} en el banner de ubicaión. Por favor escoja otra diferente.`,
          });
        }
      }

      // 2. Realizar la actualización si no hay conflicto de posición de banner
      const salonEvento = await SalonEvento.findByIdAndUpdate(
        id,
        {
          nombre_sal,
          descripcion_sal,
          galeria_sal,
          tipo_sal,
          capacidad_min,
          capacidad_max,
          direccion_sal,
          precio_sal,
          longitud,
          latitud,
          video360,
          video_sal,
          idCiudSalonEvento,
          idContactoSalon,
          idAmbienteSalon,
          idEspaciosSalon,
          idServiciosSalon,
          idTipoSalon,
          idUbicacionSalon,
          posicion_banner,
          posicion_banner_ubicacion,
        },
        { new: true }
      )
        .populate("idCiudSalonEvento")
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");

      if (!salonEvento)
        return res.status(404).json({ message: "Salón no encontrado" });

      // 3. Devolver la respuesta con el salón actualizado
      res.json(salonEvento);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Activar un evento de salón
  putActivar: async (req, res) => {
    try {
      const { id } = req.params;
      const salonEvento = await SalonEvento.findByIdAndUpdate(
        id,
        { estado: true },
        { new: true }
      )
        .populate("idCiudSalonEvento")
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");
      if (!salonEvento)
        return res.status(404).json({ message: "Salon no encontrado" });
      res.json(salonEvento);
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  // Desactivar un evento de salón
  putInactivar: async (req, res) => {
    try {
      const { id } = req.params;
      const salonEvento = await SalonEvento.findByIdAndUpdate(
        id,
        { estado: false },
        { new: true }
      )
        .populate("idCiudSalonEvento")
        .populate("idContactoSalon")
        .populate("idAmbienteSalon")
        .populate("idEspaciosSalon")
        .populate("idServiciosSalon")
        .populate("idTipoSalon")
        .populate("idUbicacionSalon");
      if (!salonEvento)
        return res.status(404).json({ message: "Salon no encontrado" });
      res.json(salonEvento);
    } catch (error) {
      res.status(500).json({ error });
    }
  },
};

export default httpSalonEvento;
