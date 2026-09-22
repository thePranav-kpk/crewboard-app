import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Ok" });
});

app.get("/auth/google", (req, res) => {
  const baseURL = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  };

  const qs = new URLSearchParams(options).toString();
  const authURL = `${baseURL}?${qs}`;

  res.redirect(authURL);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ msg: "Auth code not recieved" });
  }
  try {
    const tokenURL = "https://oauth2.googleapis.com/token";
    const tokenResponse = await fetch(tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: req.query.code,
        grant_type: "authorization_code",
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    const userURL = "https://www.googleapis.com/oauth2/v2/userinfo";

    const userResponse = await fetch(userURL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    res.status(200).json({ msg: "Authentication successful", user: userData });
  } catch (err) {}
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}...`);
});
