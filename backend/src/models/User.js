import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      // Sparse allows multiple documents to be null (so not unique) and not count in indexing
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    picture: {
      type: String,
      default: "",
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Automatically delete guest accounts after 1 day
UserSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 1 * 24 * 60 * 60, // 1 day
    partialFilterExpression: { isGuest: true },
  },
);

const User = mongoose.model("User", UserSchema);

export default User;
