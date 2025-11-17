import mongoose from "mongoose";

// Definición plana para el piso
const floorDefinition = {
  seatMap: {
    type: [[String]], // matriz 2D de strings
    required: true,
  },
};

const busLayoutSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  pisos: { type: Number, required: true },
  capacidad: { type: Number, required: true },
  tipo_Asiento_piso_1: { type: String },
  tipo_Asiento_piso_2: { type: String },
  floor1: { type: floorDefinition, required: true },
  floor2: { type: floorDefinition, required: true },
});

export default mongoose.model("BusLayout", busLayoutSchema);