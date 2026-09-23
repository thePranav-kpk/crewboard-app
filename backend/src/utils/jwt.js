import config from "../config/env.js";
import jwt from "jsonwebtoken";

// To issue new token
const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

// To verify the token
const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

export { generateToken, verifyToken };
