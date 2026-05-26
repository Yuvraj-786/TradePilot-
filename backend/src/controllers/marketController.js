import { getAllStockSymbols, getCandles, getMarketSnapshot, getPopularStocks, getQuote, getQuotes, searchStocks } from "../services/stockService.js";

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

export const getSymbols = async (req, res) => {
  try {
    const { exchange = "US" } = req.params;
    const symbols = await getAllStockSymbols(exchange);

    return res.status(200).json({
      success: true,
      data: symbols,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchSymbol = async (req, res) => {
  try {
    const { query = "" } = req.query;
    const symbols = await searchStocks(query);

    return res.status(200).json({
      success: true,
      data: symbols,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPopular = async (_req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: getPopularStocks(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
