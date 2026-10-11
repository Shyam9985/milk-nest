import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { RouterProvider } from "./app/router";
import AppProviders from "./providers/AppProviders";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider>
      <AppProviders>
        <App />
      </AppProviders>
    </RouterProvider>
  </StrictMode>
);
