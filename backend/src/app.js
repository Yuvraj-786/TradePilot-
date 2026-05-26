import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import backtestingRoutes from "./routes/backtestingRoutes.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TradePilot backend is live.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/backtesting", backtestingRoutes);

app.use(errorHandler);

export default app;