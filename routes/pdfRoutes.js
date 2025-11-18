import express from 'express';
import { downloadReservationPDF } from '../controllers/pdfController.js';

const router = express.Router();

router.get('/reservation/:reservationId/pdf', downloadReservationPDF);

export default router;