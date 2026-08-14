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
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = { message: text }; }
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

const querySuffix = (req) => {
  const index = String(req.originalUrl || '').indexOf('?');
  return index >= 0 ? String(req.originalUrl).slice(index) : '';
};

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
  app.post("/api/auth/resend-verification", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/auth/resend-verification", req.body);
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

  app.get("/api/admin/providers", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/providers"));
  app.get("/api/admin/stats", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/stats"));
  app.get("/api/admin/finance/analytics", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/finance/analytics${querySuffix(req)}`));
  app.get("/api/admin/finance/system", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/finance/system${querySuffix(req)}`));
  app.get("/api/admin/finance/user", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/finance/user${querySuffix(req)}`));
  app.get("/api/admin/settings", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/settings"));
  app.post("/api/admin/settings", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/settings", req.body));
  app.put("/api/admin/settings", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/settings", req.body));
  app.get("/api/admin/users", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/users${querySuffix(req)}`));
  app.post("/api/admin/users/create", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/users/create", req.body));
  app.post("/api/admin/users/promote", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/users/promote", req.body));
  app.post("/api/admin/users/suspend", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/users/suspend", req.body));
  app.get("/api/admin/users/transactions", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/users/transactions${querySuffix(req)}`));
  app.post("/api/admin/users/verification-link", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/users/verification-link", req.body));
  app.get("/api/admin/admins", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/admins"));
  app.post("/api/admin/admins", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/admins", req.body));
  app.get("/api/admin/profile", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/profile"));
  app.post("/api/admin/profile/update", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/profile/update", req.body));
  app.post("/api/admin/profile/password", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/profile/password", req.body));
  app.get("/api/admin/transactions", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/transactions${querySuffix(req)}`));
  app.get("/api/admin/transactions/:id", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/transactions/${req.params.id}`));
  app.post("/api/admin/wallet/credit", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/wallet/credit", req.body));
  app.post("/api/admin/wallet/debit", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/wallet/debit", req.body));
  app.post("/api/admin/wallet/reverify", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/wallet/reverify", req.body));
  app.post("/api/admin/wallet/fix-ghosts", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/wallet/fix-ghosts", req.body));
  app.get("/api/admin/wallet/logs", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/wallet/logs"));
  app.get("/api/admin/wallet/deposits", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/wallet/deposits"));
  app.get("/api/admin/services", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/services"));
  app.post("/api/admin/services", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/services", req.body));
  app.put("/api/admin/services/:id", async (req, res) => proxyRequest(req, res, "PUT", `/api/admin/services/${req.params.id}`, req.body));
  app.delete("/api/admin/services/:id", async (req, res) => proxyRequest(req, res, "DELETE", `/api/admin/services/${req.params.id}`));
  app.get("/api/admin/plans", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/plans"));
  app.post("/api/admin/plans", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/plans", req.body));
  app.put("/api/admin/plans/:id", async (req, res) => proxyRequest(req, res, "PUT", `/api/admin/plans/${req.params.id}`, req.body));
  app.delete("/api/admin/plans/:id", async (req, res) => proxyRequest(req, res, "DELETE", `/api/admin/plans/${req.params.id}`));
  app.get("/api/admin/support/tickets", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/support/tickets"));
  app.get("/api/admin/support/tickets/:id/messages", async (req, res) => proxyRequest(req, res, "GET", `/api/admin/support/tickets/${req.params.id}/messages`));
  app.post("/api/admin/support/tickets/:id/reply", async (req, res) => proxyRequest(req, res, "POST", `/api/admin/support/tickets/${req.params.id}/reply`, req.body));
  app.post("/api/admin/support/tickets/:id/status", async (req, res) => proxyRequest(req, res, "POST", `/api/admin/support/tickets/${req.params.id}/status`, req.body));
  app.post("/api/admin/support/tickets/:id/delete", async (req, res) => proxyRequest(req, res, "POST", `/api/admin/support/tickets/${req.params.id}/delete`));
  app.get("/api/admin/announcements", async (req, res) => proxyRequest(req, res, "GET", "/api/admin/announcements"));
  app.post("/api/admin/announcements", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/announcements", req.body));
  app.delete("/api/admin/announcements/:id", async (req, res) => proxyRequest(req, res, "DELETE", `/api/admin/announcements/${req.params.id}`));
  app.post("/api/admin/payments/reconcile", async (req, res) => proxyRequest(req, res, "POST", "/api/admin/payments/reconcile", req.body));

  // VTU Services (no auth required for basic service info)
  app.get("/api/vtu/providers", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/vtu/providers");
  });
  
  app.get("/api/vtu/data/plans", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/vtu/data/plans");
  });
  
  app.get("/api/vtu/cable/plans", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/vtu/cable/plans");
  });
  
  app.get("/api/vtu/electricity/plans", async (req, res) => {
    await proxyRequest(req, res, "GET", "/api/vtu/electricity/plans");
  });
  
  app.post("/api/vtu/verify", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/vtu/verify", req.body);
  });
  
  app.post("/api/vtu/purchase", async (req, res) => {
    await proxyRequest(req, res, "POST", "/api/vtu/purchase", req.body);
  });
  
}

export { registerRoutes };
