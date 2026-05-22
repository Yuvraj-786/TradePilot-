import express from "express";
import { dbTest} from "../controllers/db.controller.js";

const router = express.Router();

router.get("/db-test", dbTest);

export default router;