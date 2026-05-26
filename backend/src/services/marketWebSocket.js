import { WebSocketServer } from "ws";
import { getMarketSnapshot } from "./stockService.js";

const MARKET_BROADCAST_INTERVAL_MS = 5_000;
const MARKET_SOCKET_PATH = "/ws/market";

const clients = new Set();
let broadcastTimer = null;

const sendJson = (socket, payload) => {
  if (socket.readyState !== 1) {
    return;
  }

  socket.send(JSON.stringify(payload));
};

const broadcast = async () => {
  try {
    const snapshot = await getMarketSnapshot();
    const payload = {
      type: "market:update",
      data: snapshot,
    };

    for (const client of clients) {
      sendJson(client, payload);
    }
  } catch (error) {
    console.warn("Unable to broadcast market update via WebSocket.", error instanceof Error ? error.message : error);
  }
};

export const attachMarketWebSocket = (server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url !== MARKET_SOCKET_PATH) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (socket) => {
      wss.emit("connection", socket, request);
    });
  });

  wss.on("connection", async (socket) => {
    clients.add(socket);

    try {
      const snapshot = await getMarketSnapshot();
      sendJson(socket, {
        type: "market:init",
        data: snapshot,
      });
    } catch (error) {
      console.warn("Unable to send initial market snapshot over WebSocket.", error instanceof Error ? error.message : error);
    }

    socket.on("close", () => {
      clients.delete(socket);
    });
  });

  if (!broadcastTimer) {
    broadcastTimer = setInterval(() => {
      void broadcast();
    }, MARKET_BROADCAST_INTERVAL_MS);
  }

  return wss;
};
