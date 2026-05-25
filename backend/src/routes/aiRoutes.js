import express from "express";
import { getInsights, getInsightsHistory } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInsights);
router.get("/history", protect, getInsightsHistory);

export default router;
