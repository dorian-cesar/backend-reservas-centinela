import "dotenv/config"; // 👈 NECESARIO
import mongoose from "mongoose";
import ServiceTemplate from "../models/ServiceTemplate.js";

const run = async () => {
  console.log("MONGO_URI:", process.env.MONGO_URI); // debug

  await mongoose.connect(process.env.MONGO_URI);

  const services = await ServiceTemplate.find().sort({ _id: 1 });

  let counter = 1;

  for (const service of services) {
    const num = String(counter).padStart(3, "0");
    const newName = `C${num}`;

    await ServiceTemplate.updateOne(
      { _id: service._id },
      { $set: { NombreServicio: newName } }
    );

    console.log(`Asignado ${newName} a servicio ${service._id}`);
    counter++;
  }

  console.log("Listo!");
  process.exit();
};

run();
