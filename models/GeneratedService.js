import mongoose from "mongoose";

const seatDefinition = {
  seatNumber: String,
  reserved: { type: Boolean, default: false },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reservationExpiresAt: Date,
  confirmed: { type: Boolean, default: false },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
};

const generatedServiceSchema = new mongoose.Schema({
  template: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceTemplate" },
  date: Date,
  origin: String,
  destination: String,
  busLayout: { type: mongoose.Schema.Types.ObjectId, ref: "BusLayout" },
  seats: { type: [seatDefinition], default: [] },
  serviceName: {
    type: String,
    required: true,
    index: true
  },
  serviceNumber: {
    type: Number,
    required: true,
    index: true
  }
});

// Middleware para asegurar que serviceName y serviceNumber estén presentes
generatedServiceSchema.pre('save', function (next) {
  if (!this.serviceName && this.origin && this.destination && this.time) {
    this.serviceName = `${this.origin} → ${this.destination} ${this.time}`;
  }
  next();
});

export default mongoose.model("GeneratedService", generatedServiceSchema);