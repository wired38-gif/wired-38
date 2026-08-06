import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import TheOptimizerApp from "./TheOptimizerApp.tsx";
import "./index.css";

// Path-based routing: /optimizer → MYK.IO TheOptimizer, everything else → Entrata Training Hub
const isOptimizer = window.location.pathname.startsWith("/optimizer");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isOptimizer ? <TheOptimizerApp /> : <App />}
  </StrictMode>
);
