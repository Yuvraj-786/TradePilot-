import express from "express";
import { getBulkQuotes, getHistory, getPopular, getQuoteBySymbol, getSnapshot, getSymbols, searchSymbol } from "../controllers/marketController.js";

const router = express.Router();

router.get("/snapshot", getSnapshot);
router.get("/quote/:symbol", getQuoteBySymbol);
router.get("/quotes", getBulkQuotes);
router.get("/history/:symbol", getHistory);
router.get("/symbols/:exchange", getSymbols);
router.get("/search", searchSymbol);
router.get("/popular", getPopular);

export default router;
