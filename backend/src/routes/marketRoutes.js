import express from "express";
import { getBulkQuotes, getHistory, getQuoteBySymbol, getSnapshot } from "../controllers/marketController.js";

const router = express.Router();

router.get("/snapshot", getSnapshot);
router.get("/quote/:symbol", getQuoteBySymbol);
router.get("/quotes", getBulkQuotes);
router.get("/history/:symbol", getHistory);

export default router;
