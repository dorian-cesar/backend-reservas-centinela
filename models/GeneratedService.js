import mongoose from "mongoose";

const generatedServiceSchema = new mongoose.Schema({
  template: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceTemplate" },
  date: Date,
  origin: String,
  destination: String,
  busLayout: { type: mongoose.Schema.Types.ObjectId, ref: "BusLayout" },
  seats: [
    {
      seatNumber: String,
      reserved: { type: Boolean, default: false },
      reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
});

export default mongoose.model("GeneratedService", generatedServiceSchema);
