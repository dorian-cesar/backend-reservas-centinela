import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "GeneratedService" },
  seatNumber: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
  releasedAt: Date,
  releaseReason: String,
  authorizationCode: { type: String },
  status: {
    type: String,
    enum: ["reserved", "pending", "confirmed", "cancelled", "released", "expired"],
  },
});

export default mongoose.model("Reservation", reservationSchema);