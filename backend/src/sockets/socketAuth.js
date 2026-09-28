import cookie from "cookie";
import { verifyToken } from "../utils/jwt.js";

// Attach user to socket object after verifying token from cookies
const socketAuth = (socket, next) => {
  // Browser handles adding token to handshake.headers
  const rawCookies = socket.handshake.headers.cookie;
  if (!rawCookies) {
    return next(new Error("Unauthorized: No cookies provided"));
  }

  // Parse the cookies
  const parsedCookies = cookie.parse(rawCookies);

  // Extract the token
  const token = parsedCookies.auth_token;

  if (!token) {
    return next(new Error("Unauthorized: No auth_token cookie"));
  }
  try {
    // Verify the user
    const decodedUser = verifyToken(token);
    socket.user = decodedUser;

    // Call next middleware
    next();
  } catch (err) {
    return next(new Error("Unauthorized: Invalid or expired token"));
  }
};

export { socketAuth };
