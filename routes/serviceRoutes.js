import express from "express";
import { generateOne, generateServices, searchServices, getServicesByNumber, getGeneratedServices, deleteGeneratedServices, deleteGeneratedServiceById } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/generate", protect('superUser'), generateServices);
router.post("/generateOne/:id", protect('superUser'), generateOne);
router.get("/search", protect(), searchServices);
router.get("/listServicesByNumber", protect('superUser'), getServicesByNumber);

router.get("/generated", protect('superUser'), getGeneratedServices);
router.delete("/generated/:serviceNumber", protect('superUser'), deleteGeneratedServices);
router.delete("/:id", protect('superUser'), deleteGeneratedServiceById)

export default router;
