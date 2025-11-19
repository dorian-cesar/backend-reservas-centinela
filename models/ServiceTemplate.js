import mongoose from "mongoose";

const ServiceTemplateSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
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
  },
  // Nuevo campo: número consecutivo único para este template
  serviceNumber: {
    type: Number,
    unique: true,
    sparse: true // Permite null/undefined pero mantiene unicidad
  },
  // Nombre del servicio (calculado automáticamente)
  serviceName: {
    type: String
  }
});

// Middleware para generar serviceNumber antes de guardar
ServiceTemplateSchema.pre('save', async function (next) {
  if (this.isNew && !this.serviceNumber) {
    try {
      // Encontrar el máximo serviceNumber actual
      const maxTemplate = await mongoose.model('ServiceTemplate')
        .findOne()
        .sort({ serviceNumber: -1 });

      this.serviceNumber = maxTemplate ? maxTemplate.serviceNumber + 1 : 100;

      // Generar el nombre del servicio automáticamente
      this.serviceName = `#${this.serviceNumber} ${this.origin} → ${this.destination} ${this.time}`;

    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model("ServiceTemplate", ServiceTemplateSchema);