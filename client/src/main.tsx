import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initNative } from "./lib/native";

initNative();

createRoot(document.getElementById("root")!).render(<App />);
