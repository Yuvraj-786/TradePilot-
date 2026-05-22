// import express from "express";
// import {createUser, getAllUsers, getUserById} from "../controllers/user.controller.js";
// import { validateUser } from "../middleware/validateUser.js";

// const router = express.Router();

// router.post("/users", validateUser, createUser);
// router.get("/users", getAllUsers);
// router.get("/users/:id", getUserById);

// export default router;


import express from "express";
import { buyStock } from "../controllers/trade.controller.js";
import { validateTrade } from "../middleware/trade.middleware.js";

const router = express.Router();

router.post("/buy", validateTrade, buyStock);

export default router;