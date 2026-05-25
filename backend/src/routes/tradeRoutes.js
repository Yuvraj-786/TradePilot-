import express from "express";
import { buyStock, createTrade, getTrades, sellStock } from "../controllers/tradeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateTrade } from "../middleware/trade.middleware.js";

const router = express.Router();

router.post("/buy", protect, validateTrade, buyStock);
router.post("/sell", protect, validateTrade, sellStock);
router.post("/", protect, createTrade);
router.get("/history", protect, getTrades);

export default router;
