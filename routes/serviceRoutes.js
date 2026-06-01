import express from "express";
import { generateOne,deleteServicesAfterSeptember2026, generateServices, searchServices, getServicesByNumber, getGeneratedServices, deleteGeneratedServices, deleteGeneratedServiceById, updateGeneratedServices } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/generate", protect('superUser'), generateServices);
router.post("/deleteServicesAfterSeptember2026",  deleteServicesAfterSeptember2026);
router.post("/generateOne/:id", protect('superUser'), generateOne);
router.get("/search", protect(), searchServices);
router.get("/listServicesByNumber", protect('superUser'), getServicesByNumber);

router.get("/generated", protect('superUser'), getGeneratedServices);
router.delete("/generated/:serviceNumber", protect('superUser'), deleteGeneratedServices);
router.delete("/:id", protect('superUser'), deleteGeneratedServiceById)
router.put("/update/:serviceNumber", protect('superUser'), updateGeneratedServices);

export default router;
