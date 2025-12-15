import express from "express";
import {
    createTemplate,
    listTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    listTemplatesByDay,
    getTemplatesBySpecificDay,
    toggleTemplateActive
} from "../controllers/templateController.js";

const router = express.Router();

// CRUD básico
router.post("/", createTemplate);
router.get("/", listTemplates);
router.get("/byDay", listTemplatesByDay);
router.get("/day/:day", getTemplatesBySpecificDay);
router.get("/:id", getTemplateById);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);
router.patch("/:id/toggle", toggleTemplateActive);

// Rutas específicas para agrupación por días

export default router;