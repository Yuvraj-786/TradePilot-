import express from "express";
import { register, login, demoLogin, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/demo", demoLogin);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
