import express from "express";
import { getUsers, deleteUser, updateUser, toggleUserActivo, createUser } from "../controllers/userController.js";
const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);
router.put("/:id", updateUser)
router.delete("/:id", deleteUser);
router.patch("/:id/activo", toggleUserActivo);

export default router;
