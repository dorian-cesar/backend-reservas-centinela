import express from "express";
import { register, login, loginRut } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/loginRut", loginRut);

export default router;
