import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Interface globale pour détecter Tauri
declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

// Initialiser le CSS personnalisé sauvegardé par l'utilisateur
const savedCustomCss = localStorage.getItem("auramail_custom_css");
if (savedCustomCss) {
  let styleTag = document.getElementById("auramail-custom-theme");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "auramail-custom-theme";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = savedCustomCss;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
