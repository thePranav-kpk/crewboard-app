import express from "express";
import {
  createRoom,
  getRecentRooms,
  getRoom,
  deleteRoom,
} from "../controllers/roomController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, createRoom);
router.get("/recent", authenticateUser, getRecentRooms);
router
  .route("/:roomId")
  .get(authenticateUser, getRoom)
  .delete(authenticateUser, deleteRoom);

export default router;
