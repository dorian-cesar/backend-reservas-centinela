import mongoose from "mongoose";

const ServiceTemplateSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
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
  serviceNumber: {
    type: Number,
    unique: true,
    sparse: true
  },
  serviceName: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Middleware para generar serviceNumber antes de guardar
ServiceTemplateSchema.pre('save', async function (next) {
  try {
    // Solo para nuevos documentos
    if (this.isNew && !this.serviceNumber) {
      // Encontrar el máximo serviceNumber actual
      const maxTemplate = await mongoose.model('ServiceTemplate')
        .findOne()
        .sort({ serviceNumber: -1 });

      this.serviceNumber = maxTemplate ? maxTemplate.serviceNumber + 1 : 100;
    }

    // Siempre actualizar el serviceName con el formato correcto
    // Manteniendo el número si ya existe
    const numberPart = this.serviceNumber ? `#${this.serviceNumber}` : '#N/A';
    this.serviceName = `${numberPart} ${this.origin} → ${this.destination} ${this.time}`;

  } catch (error) {
    return next(error);
  }
  next();
});


ServiceTemplateSchema.statics.checkAndDeactivateExpired = async function () {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1); // Verificar desde ayer para evitar race conditions

  const result = await this.updateMany(
    {
      active: true,
      endDate: { $ne: null, $lte: yesterday }
    },
    {
      $set: { active: false }
    }
  );

  return result;
};


export default mongoose.model("ServiceTemplate", ServiceTemplateSchema);