import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trade",
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: ["trade-analysis", "behavioral", "risk-summary", "learning-tip"],
    },
    summary: {
      type: String,
      required: true,
    },
    recommendation: {
      type: String,
      default: "",
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    flags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Insight = mongoose.model("Insight", insightSchema);

export default Insight;
