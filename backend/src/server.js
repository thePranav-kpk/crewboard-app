import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { socketAuth } from "./sockets/socketAuth.js";
import { registerBoardHandlers } from "./sockets/boardHandler.js";
import { connectDB } from "./config/db.js";

// Express server is just a function
const app = express();

// Create HTTP server
const httpServer = createServer(app);

const corsOptions = {
  origin: config.CLIENT_URL,
  credentials: true, // Allow credentials (cookies) to be sent with requests
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Use socketAuth middleware to attach user to socket object
io.use(socketAuth);

// Listen for connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.name}(${socket.id})`);
  registerBoardHandlers(io, socket);
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

// Connect to DB
connectDB();

// Express server & HTTP server listening
httpServer.listen(config.PORT, () => {
  console.log(`Server running on ${config.PORT}...`);
});
