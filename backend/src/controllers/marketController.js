import { getCandles, getMarketSnapshot, getQuote, getQuotes } from "../services/stockService.js";

export const getSnapshot = async (_req, res) => {
  try {
    const snapshot = await getMarketSnapshot();

    return res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getQuoteBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getQuote(symbol);

    return res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBulkQuotes = async (req, res) => {
  try {
    const symbols = (req.query.symbols || "").split(",").filter(Boolean);
    const quotes = await getQuotes(symbols);

    return res.status(200).json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { resolution = "1H" } = req.query;
    const candles = await getCandles(symbol, resolution);

    return res.status(200).json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        resolution,
        candles,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
