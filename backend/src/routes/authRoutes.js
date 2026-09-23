import express from "express";
import {
  googleCallback,
  googleLogin,
  getMe,
  logout,
} from "../controllers/authController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/logout", logout);
router.get("/me", authenticateUser, getMe);

export default router;
