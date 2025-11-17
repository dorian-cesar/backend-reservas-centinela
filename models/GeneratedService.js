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
});

export default mongoose.model("GeneratedService", generatedServiceSchema);