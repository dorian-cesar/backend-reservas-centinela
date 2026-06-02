import express from "express";
import { 
  generateOne, 
  deleteServicesAfterSeptember2026, // <- Tu nuevo controlador
  generateServices, 
  searchServices, 
  getServicesByNumber, 
  getGeneratedServices, 
  deleteGeneratedServices, 
  deleteGeneratedServiceById, 
  updateGeneratedServices 
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. RUTAS ESTÁTICAS (Sin parámetros dinámicos)
router.post("/generate", protect('superUser'), generateServices);
router.get("/search", protect(), searchServices);
router.get("/listServicesByNumber", protect('superUser'), getServicesByNumber);
router.get("/generated", protect('superUser'), getGeneratedServices);

// 🔥 NUEVO ENDPOINT LIMPIO (Colocado estratégicamente antes de los ":id")
router.delete("/purge-after-september-2026", deleteServicesAfterSeptember2026);

// 2. RUTAS CON PARÁMETROS DINÁMICOS (Al final)
router.post("/generateOne/:id", protect('superUser'), generateOne);
router.delete("/generated/:serviceNumber", protect('superUser'), deleteGeneratedServices);
router.delete("/:id", protect('superUser'), deleteGeneratedServiceById);
router.put("/update/:serviceNumber", protect('superUser'), updateGeneratedServices);

export default router;
