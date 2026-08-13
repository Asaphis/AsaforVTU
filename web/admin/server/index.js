import express from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFiles() {
  const files = [".env", ".env.local"];
  const here = __dirname;
  const searchDirs = [
    process.cwd(),
    here,
    path.resolve(here, ".."),
    path.resolve(here, "../.."),
  ];
  for (const dir of searchDirs) {
    for (const name of files) {
      const p = path.resolve(dir, name);
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, "utf8");
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnvFiles();

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const allowedOrigins = new Set(
  [
    process.env.ADMIN_ORIGIN,
    process.env.ADMIN_FRONTEND_ORIGIN,
    process.env.VITE_ADMIN_ORIGIN,
    process.env.ADMIN_PANEL_ORIGIN,
  ]
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim().replace(/^`|`$/g, ""))
);

app.use((req, res, next) => {
  const origin = String(req.headers.origin || "");
  if (origin && (allowedOrigins.size === 0 || allowedOrigins.has(origin))) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Email");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source]} ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

registerRoutes(app);

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

const port = parseInt(process.env.PORT || "5003", 10);
const listenOptions = { port };
if (process.platform !== "win32") {
  listenOptions.host = "0.0.0.0";
  listenOptions.reusePort = true;
}
httpServer.listen(listenOptions, () => {
  log(`serving on port ${port}`);
});
