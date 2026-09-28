import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Express server is just a function
const app = express();

// Create HTTP server
const httpServer = createServer(app);

const corsOptions = {
  origin: config.CLIENT_URL,
  credentials: true,          // Allow credentials (cookies) to be sent with requests
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Allow client url to make requests
app.use(cors(corsOptions));

// To parse incoming json requests bodies
app.use(express.json());

// To parse cookies from incoming requests
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Ok" });
});

app.use("/auth", authRoutes);

// Express server & HTTP server listening
httpServer.listen(config.PORT, () => {
  console.log(`Server running on ${config.PORT}...`);
});
