import express from "express";
import { createTemplate, generateOne, generateServices, listTemplates, searchServices, getServicesByNumber } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/template", protect('admin'), createTemplate);
router.post("/generate", protect('admin'), generateServices);
router.post("/generateOne/:id", protect('admin'), generateOne);
router.get("/search", protect(), searchServices);
router.get("/listTemplates", protect('admin'), listTemplates);
router.get("/listServicesByNumber", protect('admin'), getServicesByNumber);


export default router;
