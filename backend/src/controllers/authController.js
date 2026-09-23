import config from "../config/env.js";
import crypto from "crypto";
import { getGoogleAuthUrl, getGoogleUser } from "../services/authService.js";
import { generateToken, verifyToken } from "../utils/jwt.js";

const OAUTH_STATE_COOKIE = "oauth_state";
const AUTH_TOKEN_COOKIE = "auth_token";

const googleLogin = (req, res) => {
  // Random cryptographic string to prevent CSRF attacks
  const state = crypto.randomBytes(32).toString("hex");
  const options = {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
    sameSite: "lax",
  };

  // Set the cookie to store state
  res.cookie(OAUTH_STATE_COOKIE, state, options);

  const authUrl = getGoogleAuthUrl(state);
  res.redirect(authUrl);
};

const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.[OAUTH_STATE_COOKIE];

  if (!code || !state || storedState !== state) {
    res.clearCookie(OAUTH_STATE_COOKIE);
    return res.status(400).json({ message: "Invalid or expired OAuth state" });
  }

  try {
    const user = await getGoogleUser(code);

    const jwt = generateToken({
      id: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    const options = {
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Set the cookie to store JWT
    res.cookie(AUTH_TOKEN_COOKIE, jwt, options);

    // Clear the cookie storing state
    res.clearCookie(OAUTH_STATE_COOKIE);
    res.redirect(config.CLIENT_URL);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Authentication failed", error: err.message });
  }
};

const getMe = (req, res) => {
  res.status(200).json({ user: req.user });
};

const logout = (req, res) => {
  res.clearCookie(AUTH_TOKEN_COOKIE);
  res.status(200).json({ message: "Logged out successfully" });
};

export { googleLogin, googleCallback, getMe, logout };
