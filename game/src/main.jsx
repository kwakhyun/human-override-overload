import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/rajdhani/latin-500.css";
import "@fontsource/rajdhani/latin-600.css";
import "@fontsource/rajdhani/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import { App } from "./App.jsx";
import "./styles.css";
import "./styles/p1-p2.css";
import "./styles/tactical-os.css";
import "./styles/save-profiles.css";
import "./styles/settings.css";
import "./styles/defense-overhaul.css";
import "./styles/tag-cutscene.css";
import "./styles/npc-portraits.css";
import "./styles/combat-ui-refinement.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
