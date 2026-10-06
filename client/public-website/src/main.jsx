import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PublicStatsProvider } from "./contexts/PublicStatsContext";
import { ThemeContextProvider } from "./contexts/ThemeContext";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeContextProvider>
      <PublicStatsProvider>
        <App />
      </PublicStatsProvider>
    </ThemeContextProvider>
  </React.StrictMode>
);
