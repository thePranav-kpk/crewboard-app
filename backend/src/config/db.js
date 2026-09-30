import mongoose from "mongoose";
import config from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log("MongoDB conencted: ", conn.connection.host);
  } catch (err) {
    console.log("MongoDB connection error: ", err.message);
    process.exit(1);
  }
};

export { connectDB };
