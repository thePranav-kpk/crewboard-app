import express from "express";
import {
  createRoom,
  getRecentRooms,
  getRoom,
  deleteRoom,
  renameRoomName,
  toggleRoomLock,
} from "../controllers/roomController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, createRoom);
router.get("/recent", authenticateUser, getRecentRooms);
router
  .route("/:roomId")
  .get(authenticateUser, getRoom)
  .delete(authenticateUser, deleteRoom)
  .patch(authenticateUser, renameRoomName);
router.patch("/:roomId/lock", authenticateUser, toggleRoomLock);

export default router;
