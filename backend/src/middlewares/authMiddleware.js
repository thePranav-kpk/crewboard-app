import { verifyToken } from "../utils/jwt.js";

const authenticateUser = (req, res, next) => {
  const jwt = req.cookies?.auth_token;
  if (!jwt) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const decodedToken = verifyToken(jwt);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export { authenticateUser };
