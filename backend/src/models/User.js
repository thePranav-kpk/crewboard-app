import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: [true, "GoogleId is required"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    picture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

export default User;
