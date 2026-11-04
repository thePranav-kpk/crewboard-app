import config from "../config/env.js";
import crypto from "crypto";
import { getGoogleAuthUrl, getGoogleUser } from "../services/authService.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

const OAUTH_STATE_COOKIE = "oauth_state";
const AUTH_TOKEN_COOKIE = "auth_token";

const CURSOR_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
];

const GUEST_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const googleLogin = (req, res) => {
  // Random cryptographic string to prevent CSRF attacks
  const state = crypto.randomBytes(32).toString("hex");
  const options = {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
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
    const googleProfile = await getGoogleUser(code);

    let user = await User.findOne({ googleId: googleProfile.googleId });
    if (!user) {
      user = await User.create({
        googleId: googleProfile.googleId,
        name: googleProfile.name,
        email: googleProfile.email,
        picture: googleProfile.picture,
      });
    } else {
      // Sync latest avatar or name if updated on Google
      user.name = googleProfile.name;
      user.picture = googleProfile.picture;
      await user.save();
    }

    // Sign JWT with MongoDB userId
    const jwt = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    const options = {
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Set the cookie to store JWT
    res.cookie(AUTH_TOKEN_COOKIE, jwt, options);

    // Clear the cookie storing state
    res.clearCookie(OAUTH_STATE_COOKIE);

    // If opened in a popup window, notify the parent opener window and auto-close
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0d0f12;color:#f1f5f9;">
          <div style="text-align:center;">
            <p style="font-size:16px;font-weight:600;">Signed in successfully!</p>
            <p style="font-size:13px;color:#94a3b8;">Closing this window...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS" }, "${config.CLIENT_URL}");
              window.close();
            } else {
              window.location.href = "${config.CLIENT_URL}";
            }
          </script>
        </body>
      </html>
    `;
    return res.status(200).send(successHtml);
  } catch (err) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0d0f12;color:#ef4444;">
          <div style="text-align:center;">
            <p style="font-size:16px;font-weight:600;">Authentication Failed</p>
            <p style="font-size:13px;color:#94a3b8;">Closing this window...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_ERROR", error: "${err.message}" }, "${config.CLIENT_URL}");
              window.close();
            } else {
              window.location.href = "${config.CLIENT_URL}";
            }
          </script>
        </body>
      </html>
    `;
    return res.status(500).send(errorHtml);
  }
};

const getMe = (req, res) => {
  res.status(200).json({ user: req.user });
};

const logout = (req, res) => {
  res.clearCookie(AUTH_TOKEN_COOKIE, {
    // Remove even cross-site cookies
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

const guestLogin = async (req, res) => {
  const id = Math.floor(Math.random() * 1000);
  const name = "Guest";
  const picture = GUEST_AVATAR;
  const color = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

  try {
    let user = await User.create({ name, picture, isGuest: true });

    const jwt = generateToken({
      id: user?.id.toString(),
      name: user.name,
      picture: user.picture,
      isGuest: true,
      color, // Store color as well for guest user
    });

    const options = {
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1 * 24 * 60 * 60 * 1000, // Only 1 day
    };

    res.cookie(AUTH_TOKEN_COOKIE, jwt, options);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        picture: user.picture,
        isGuest: true,
        color,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export { googleLogin, googleCallback, getMe, logout, guestLogin };
