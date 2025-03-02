import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import FeConfigProvider from "./configs/FeConfigProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FeConfigProvider>
    <App />
    </FeConfigProvider>
  </React.StrictMode>
);
