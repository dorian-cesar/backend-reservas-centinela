import mongoose from "mongoose";

const serviceTemplateSchema = new mongoose.Schema({
  origin: String,
  destination: String,
  departureTime: String,
  frequency: { type: String, enum: ["daily", "weekly", "custom"] },
  daysOfWeek: [String], // ["Mon", "Wed", "Fri"]
  layout: { type: mongoose.Schema.Types.ObjectId, ref: "BusLayout" },
  startDate: Date,
  endDate: Date,
  company: String,
});

export default mongoose.model("ServiceTemplate", serviceTemplateSchema);
