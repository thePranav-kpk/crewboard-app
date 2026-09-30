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

  // Just redirect the Window tab to URL as backend does all the work
  const login = () => {
    window.location.href = `${apiClient.defaults.baseURL}/auth/google`;
  };

  // Logout function
  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.log("Failed to notify server of logout: ", err.message);
    } finally {
      setUser(null);      // Logout the user whatsoever
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
