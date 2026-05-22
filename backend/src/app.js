import express from "express";
import userRoutes from "./routes/user.routes.js";
import dbtestRoutes from "./routes/dbtest.routes.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import tradeRoutes from "./routes/trade.routes.js";

const app = express();

// middleware (important later)
app.use(express.json());

app.use(logger);

app.use(errorHandler);

// user routes connect
app.use("/api", userRoutes);

app.use("/api", dbtestRoutes);

app.use("/api/trade", tradeRoutes);

export default app;