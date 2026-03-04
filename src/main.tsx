// Prevent MetaMask / browser-extension unhandled rejections from blanking the app
window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason || "");
  if (msg.includes("MetaMask") || msg.includes("chrome-extension")) {
    event.preventDefault();
  }
});

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
