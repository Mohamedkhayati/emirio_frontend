import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./i18n";
// Add these at the top of your main.jsx or App.jsx
import "primereact/resources/themes/lara-light-indigo/theme.css"; // or whichever theme you prefer
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);