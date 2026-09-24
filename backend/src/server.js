import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Allow client url to make requests
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,           // Allow credentials (cookies) to be sent with requests
  }),
);

// To parse incoming json requests bodies
app.use(express.json());

// To parse cookies from incoming requests
app.use(cookieParser());

// Health check endpoint 
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Ok" });
});

app.use("/auth", authRoutes);

app.listen(config.PORT, () => {
  console.log(`Server running on ${config.PORT}...`);
});
