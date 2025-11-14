// controllers/busLayoutController.js
import BusLayout from "../models/BusLayout.js";

// Crear un layout
export const createLayout = async (req, res) => {
  try {
    const layout = new BusLayout(req.body);
    await layout.save();
    res.status(201).json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos
export const getLayouts = async (req, res) => {
  try {
    const layouts = await BusLayout.find();
    res.json(layouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
export const getLayoutById = async (req, res) => {
  try {
    const layout = await BusLayout.findById(req.params.id);

    if (!layout)
      return res.status(404).json({ error: "Layout no encontrado" });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
export const updateLayout = async (req, res) => {
  try {
    const layout = await BusLayout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!layout)
      return res.status(404).json({ error: "Layout no encontrado" });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
export const deleteLayout = async (req, res) => {
  try {
    const layout = await BusLayout.findByIdAndDelete(req.params.id);

    if (!layout)
      return res.status(404).json({ error: "Layout no encontrado" });

    res.json({ message: "Layout eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//comentario de prueba//