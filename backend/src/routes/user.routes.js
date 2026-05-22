import express from "express";
import {createUser, getAllUsers, getUserById} from "../controllers/user.controller.js";
import { validateUser } from "../middleware/user.middleware.js";

const router = express.Router();

router.post("/users", validateUser, createUser);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);

export default router;