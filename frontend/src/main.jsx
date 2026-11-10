import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Inject Umami Analytics only if configured in environment
const umamiUrl = import.meta.env.VITE_UMAMI_URL;
const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

if (umamiUrl && umamiWebsiteId && typeof window !== "undefined") {
  const script = document.createElement("script");
  script.defer = true;
  script.src = umamiUrl;
  script.setAttribute("data-website-id", umamiWebsiteId);
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
