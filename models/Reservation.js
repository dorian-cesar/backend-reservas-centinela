import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "GeneratedService" },
  seatNumber: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "cancelled"], default: "active" },
});

export default mongoose.model("Reservation", reservationSchema);
