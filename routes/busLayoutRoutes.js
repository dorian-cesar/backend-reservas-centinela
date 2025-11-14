// routes/busLayoutRoutes.js
import express from "express";
import {
  createLayout,
  getLayouts,
  getLayoutById,
  updateLayout,
  deleteLayout,
} from "../controllers/busLayoutController.js";

const router = express.Router();

router.post("/", createLayout);
router.get("/", getLayouts);
router.get("/:id", getLayoutById);
router.put("/:id", updateLayout);
router.delete("/:id", deleteLayout);

export default router;
