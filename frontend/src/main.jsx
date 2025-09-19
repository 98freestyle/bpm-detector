import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Restore scroll position to top on page load
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Also ensure page starts at top
window.history.scrollRestoration = 'manual';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);