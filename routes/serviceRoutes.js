import express from "express";
import { createTemplate, generateOne, generateServices, listTemplates, searchServices  } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/template", protect, createTemplate);
router.post("/generate", protect, generateServices);
router.post("/generateOne/:id", protect, generateOne);
router.get("/search", searchServices);
router.get("/listTemplates", listTemplates)

export default router;
