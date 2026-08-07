import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TheOptimizerApp from "./TheOptimizerApp.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TheOptimizerApp />
  </StrictMode>
);
