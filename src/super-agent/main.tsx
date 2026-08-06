import React from "react";
import ReactDOM from "react-dom/client";
import SuperAgentApp from "./SuperAgentApp";
import "../index.css";

const root = document.getElementById("sa-root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SuperAgentApp />
    </React.StrictMode>
  );
}
