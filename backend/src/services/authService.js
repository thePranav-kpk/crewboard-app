import config from "../config/env.js";

const getGoogleAuthUrl = (state) => {
  const baseURL = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    client_id: config.GOOGLE_CLIENT_ID,        // Unique identifier for app
    redirect_uri: config.GOOGLE_REDIRECT_URI,  // Redirect url after login
    response_type: "code",                     // Requests auth code      
    scope: "openid email profile",             // Only these scopes can be accessed by app
    access_type: "offline",                    // Requests a refresh token
    prompt: "select_account consent",          // Consent screen to get refresh token
    state: state,                              // Random string to prevent CSRF Attacks     
  };

  const qs = new URLSearchParams(options).toString();
  const authURL = `${baseURL}?${qs}`;
  return authURL;
};

// Exchange auth code to get access token
const getGoogleUser = async (code) => {
  const tokenURL = "https://oauth2.googleapis.com/token";
  const tokenResponse = await fetch(tokenURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: code,                                   // Attach the auth code
      grant_type: "authorization_code",             
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange auth code with Google")
  }

  // tokenData contains accessToken
  const tokenData = await tokenResponse.json();
  const userURL = "https://www.googleapis.com/oauth2/v2/userinfo";

  const userResponse = await fetch(userURL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch user profile from Google")
  }

  const userData = await userResponse.json();

  // Return userdata to create JWT to persist data
  return {
    googleId: userData.id,
    email: userData.email,
    name: userData.name,
    picture: userData.picture,
  };
};

export { getGoogleAuthUrl, getGoogleUser };
