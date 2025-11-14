import express from "express";
import { createTemplate, generateServices, searchServices  } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/template", protect, createTemplate);
router.post("/generate", protect, generateServices);
router.get("/search", searchServices);

export default router;
