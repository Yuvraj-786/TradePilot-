import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initializeSchema } from "./config/db.js";
import { attachMarketWebSocket } from "./services/marketWebSocket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeSchema();
    const server = http.createServer(app);
    attachMarketWebSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();