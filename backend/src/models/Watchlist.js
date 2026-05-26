import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    symbols: {
      type: [String],
      default: [],
      validate: {
        validator: (symbols) => symbols.every((symbol) => typeof symbol === "string" && symbol.trim().length > 0),
        message: "Watchlist symbols must be non-empty strings.",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;
