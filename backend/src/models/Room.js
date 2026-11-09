import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, "RoomId is required"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    keyHash: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    elements: {
      type: Array,
      default: [],
    },
    inviteToken: {
      type: String,
      index: true, // To make server lookup rooms faster
    },
    // [] populates members and defaults to empty array
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

const Room = mongoose.model("Room", RoomSchema);

export default Room;
