function getBackendUrl() {
  const prodUrl = process.env.VITE_VTU_BACKEND_URL || process.env.BACKEND_URL || "https://vtuapi.ferixas.com";
  const localUrl = process.env.VITE_VTU_BACKEND_URL_LOCAL || "http://localhost:5000";
  const isDev = process.env.NODE_ENV === "development";
  return isDev ? localUrl : prodUrl;
}

async function proxyRequest(req, res, method, path, body) {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${path}`;
  const token = req.headers.authorization || "";
  
  console.log(`[Proxy] ${method} ${url} - Token: ${token ? 'present' : 'missing'}`);
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: token } : {}),
  };
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    
    console.log(`[Proxy] Response status: ${response.status}, data:`, data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[Proxy] Error proxying to ${path}:`, error);
    res.status(500).json({ error: error.message || "Backend request failed" });
  }
}

async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await response.json();
    const allowedAdminEmails = (process.env.ADMIN_EMAILS || "asaphis.org@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = user.is_admin || user.role === "admin" || allowedAdminEmails.includes(user.email.toLowerCase());
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("[Admin Auth] Error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}

function registerRoutes(app) {
  app.get("/api/health", (req, res) => {
    res.json({ server: "up", time: new Date().toISOString(), backend: getBackendUrl() });
  });
  
  app.post("/api/auth/login", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/login", req.body);
  });
  
  app.post("/api/auth/register", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/register", req.body);
  });
  
  app.post("/api/auth/refresh", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/refresh", req.body);
  });
  
  app.post("/api/auth/logout", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/logout", req.body);
  });
  
  app.get("/api/auth/me", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/auth/me");
  });
  
  app.post("/api/auth/forgot-password", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/forgot-password", req.body);
  });
  
  app.post("/api/auth/reset-password", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/reset-password", req.body);
  });
  
  app.post("/api/auth/verify-email", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/verify-email", req.body);
  });
  
  app.post("/api/auth/change-password", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/change-password", req.body);
  });
  
  app.put("/api/auth/profile", async (req, res) => {
    await proxyRequest(req, res, "PUT", "/api/auth/profile", req.body);
  });
  
  app.get("/api/services", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/services");
  });
  
  app.get("/api/services/:slug", async (req, res) => {
    await proxyRequest(req, res, "GET", `/api/services/${req.params.slug}`);
  });
  
  app.get("/api/plans", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/plans");
  });
  
  app.get("/api/plans/:id", async (req, res) => {
    await proxyRequest(req, res, "GET", `/api/plans/${req.params.id}`);
  });
  
  app.get("/api/announcements", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/announcements");
  });
  
  app.get("/api/announcements/:id", async (req, res) => {
    await proxyRequest(req, res, "GET", `/api/announcements/${req.params.id}`);
  });
  
  app.use("/api/admin", adminAuth);
  
  app.get("/api/admin/users", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/admin/users");
  });
  
  app.get("/api/admin/users/:id", async (req, res) => {
    await proxyRequest(req, res, "GET", `/api/admin/users/${req.params.id}`);
  });
  
  app.put("/api/admin/users/:id", async (req, res) => {
    await proxyRequest(req, res, "PUT", `/api/admin/users/${req.params.id}`, req.body);
  });
  
  app.delete("/api/admin/users/:id", async (req, res) => {
    await proxyRequest(req, res, "DELETE", `/api/admin/users/${req.params.id}`);
  });
  
  app.get("/api/admin/transactions", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/admin/transactions");
  });
  
  app.get("/api/admin/wallets", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/admin/wallets");
  });
  
  app.get("/api/admin/settings", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/admin/settings");
  });
  
  app.put("/api/admin/settings", async (req, res) => {
    await proxyRequest(req, res, "PUT", "/api/admin/settings", req.body);
  });
}

export { registerRoutes };
