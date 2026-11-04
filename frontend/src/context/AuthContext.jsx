/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user on mounting/loading
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        setUser(response.data.user);
      } catch (err) {
        console.log("Failed to fetch user: ", err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Open Google OAuth in a centered popup window and sync session via postMessage
  const login = () => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${apiClient.defaults.baseURL}/auth/google`,
      "crewboard_google_login",
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`,
    );

    // Fallback redirect if browser strictly blocks popups
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      window.location.href = `${apiClient.defaults.baseURL}/auth/google`;
      return;
    }

    const handleMessage = async (event) => {
      const allowedApiOrigin = new URL(apiClient.defaults.baseURL).origin;
      if (
        event.origin !== allowedApiOrigin &&
        event.origin !== window.location.origin
      ) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        try {
          const response = await apiClient.get("/auth/me");
          setUser(response.data.user);
        } catch (err) {
          console.error("Failed to fetch user after OAuth popup:", err);
        }
      } else if (event.data?.type === "OAUTH_AUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        console.error("OAuth authentication error:", event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  // Logout function
  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.log("Failed to notify server of logout: ", err.message);
    } finally {
      setUser(null); // Logout the user whatsoever
    }
  };

  // To login as guest
  const guestLogin = async () => {
    try {
      const resposne = await apiClient.post("/auth/guest");
      setUser(resposne.data.user);
    } catch (err) {
      console.log("Failed to login as guest: ", err.message);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, guestLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
