import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";

export const createTemplate = async (req, res) => {
  try {
    const template = await ServiceTemplate.create(req.body);
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const generateServices = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find();
    const today = new Date();

    for (const t of templates) {
      let currentDate = new Date(t.startDate);
      while (currentDate <= t.endDate) {
        await GeneratedService.create({
          template: t._id,
          date: currentDate,
          origin: t.origin,
          destination: t.destination,
          busLayout: t.layout,
        });
        currentDate.setDate(currentDate.getDate() + 7); // semanal
      }
    }

    res.json({ message: "Servicios generados exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//comentario de prueba//