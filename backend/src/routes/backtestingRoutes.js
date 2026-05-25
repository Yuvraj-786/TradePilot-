import express from "express";
import { runBacktest } from "../controllers/backtestingController.js";

const router = express.Router();

router.post("/", runBacktest);

export default router;
