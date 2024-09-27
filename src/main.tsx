import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // If you have any global CSS

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
    <App />
);