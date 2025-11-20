import express from 'express';
import { getServiceReport, getDateRangeReport, getPassengersReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/service/:serviceId', getServiceReport);
router.get('/date', getDateRangeReport);
router.get('/user/:serviceId', getPassengersReport);

export default router;