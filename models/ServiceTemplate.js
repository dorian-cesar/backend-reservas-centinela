import mongoose from "mongoose";

const ServiceTemplateSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  //endDate: { type: Date, required: true },
  time: { type: String, required: true }, // "06:30"
  company: { type: String },

  layout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusLayout",
    required: true
  },

  // 1 = Lunes ... 7 = Domingo
  daysOfWeek: {
    type: [Number],
    required: true
  }
});

export default mongoose.model("ServiceTemplate", ServiceTemplateSchema);

