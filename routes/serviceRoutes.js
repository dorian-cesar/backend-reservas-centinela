import express from "express";
import { generateOne, generateServices, searchServices, getServicesByNumber, getGeneratedServices, deleteGeneratedServices } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/generate", protect('superUser'), generateServices);
router.post("/generateOne/:id", protect('superUser'), generateOne);
router.get("/search", protect(), searchServices);
router.get("/listServicesByNumber", protect('superUser'), getServicesByNumber);

router.get("/generated", protect('superUser'), getGeneratedServices);
router.delete("/generated/:serviceNumber", protect('superUser'), deleteGeneratedServices);


export default router;
