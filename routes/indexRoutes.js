import express from 'express';
import { protect } from "../middleware/authMiddleware.js";

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import reservationRoutes from './reservationRoutes.js';
import busLayoutRoutes from './busLayoutRoutes.js';
import cityRoutes from './cityRoutes.js';
import mailRoutes from './mailroutes.js';
import pdfRoutes from './pdfRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes); // sin auth
router.use('/users', protect('admin', 'superUser'), userRoutes);
router.use('/services', serviceRoutes); // maneja su propio auth en sus rutas
router.use('/reservations', protect(), reservationRoutes);
router.use('/layouts', protect('admin', 'superUser'), busLayoutRoutes);
router.use('/cities', cityRoutes); // sin auth
router.use('/mail', protect(), mailRoutes);
router.use('/pdf', pdfRoutes); // sin auth
router.use('/reports', protect('admin', 'superUser'), reportRoutes);

export default router;
