import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./type-system.css";
import "./public-reference-overrides.css";
import "./public-mobile-repair.css";
import "./logo-transparency.css";

createRoot(document.getElementById("root")!).render(<App />);
