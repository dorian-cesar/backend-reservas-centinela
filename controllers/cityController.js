import ServiceTemplate from "../models/ServiceTemplate.js";

/**
 * Lista todas las ciudades de origen sin duplicar
 */
export const listOrigins = async (req, res) => {
  try {
    const origins = await ServiceTemplate.distinct("origin");
    res.json({ origins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Dado un origen, lista sus destinos asociados
 * /cities/destinations/:origin
 */
export const listDestinationsByOrigin = async (req, res) => {
  try {
    const { origin } = req.params;

    const destinations = await ServiceTemplate.find({ origin }).distinct(
      "destination"
    );

    res.json({
      origin,
      destinations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Lista de origen → destinos agrupados
 * /cities/map
 */
export const originDestinationMap = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find({}, "origin destination");

    const map = {};

    templates.forEach((t) => {
      if (!map[t.origin]) map[t.origin] = [];
      if (!map[t.origin].includes(t.destination)) {
        map[t.origin].push(t.destination);
      }
    });

    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
