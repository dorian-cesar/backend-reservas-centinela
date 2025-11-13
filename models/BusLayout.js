import mongoose from "mongoose";

const busLayoutSchema = new mongoose.Schema({
  name: String,
  seats: Number,
  rows: Number,
  columns: Number,
  seatMap: [
    {
      seatNumber: String,
      floor: Number,
      available: Boolean,
    },
  ],
});

export default mongoose.model("BusLayout", busLayoutSchema);
