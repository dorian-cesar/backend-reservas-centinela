import express from "express";
import {
  listOrigins,
  listDestinationsByOrigin,
  originDestinationMap,
} from "../controllers/cityController.js";

const router = express.Router();

router.get("/origins", listOrigins);
router.get("/destinations/:origin", listDestinationsByOrigin);
router.get("/map", originDestinationMap);

export default router;
