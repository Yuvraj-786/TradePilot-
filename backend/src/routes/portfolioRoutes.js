import express from "express";
import { getPortfolio } from "../controllers/portfolioController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getPortfolio);

export default router;
