import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

function getBackendUrl(): string {
  const prodUrl = process.env.VITE_VTU_BACKEND_URL || process.env.BACKEND_URL || "https://vtuapi.ferixas.com";
  const localUrl = process.env.VITE_VTU_BACKEND_URL_LOCAL || "http://localhost:5000";
  
  // Check if we're in development
  const isDev = process.env.NODE_ENV === "development";
  return isDev ? localUrl : prodUrl;
}

// Helper to proxy requests to backend
async function proxyRequest<T>(req: Request, res: Response, method: string, path: string, body?: any): Promise<void> {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${path}`;
  
  const token = req.headers.authorization || "";
  
  const headers: HeadersInit = {
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

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error(`[Proxy] Error proxying to ${path}:`, error);
    res.status(500).json({ error: error.message || "Backend request failed" });
  }
}

// Admin auth middleware
async function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  
  try {
    // Verify token with backend
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await response.json();
    
    // Check if admin
    const allowedAdminEmails = (process.env.ADMIN_EMAILS || "asaphis.org@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = user.is_admin || user.role === "admin" || allowedAdminEmails.includes(user.email.toLowerCase());

    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error("[Admin Auth] Error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function registerRoutes(app: Express, httpServer: Server): void {

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      server: "up",
      time: new Date().toISOString(),
      backend: getBackendUrl(),
    });
  });

  // Auth routes (proxy to backend)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/login", req.body);
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/register", req.body);
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/refresh", req.body);
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/logout", req.body);
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/auth/me");
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/forgot-password", req.body);
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/reset-password", req.body);
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/verify-email", req.body);
  });

  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/auth/change-password", req.body);
  });

  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "PUT", "/api/auth/profile", req.body);
  });

  // Public API routes (no auth required)
  app.get("/api/services", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/services");
  });

  app.get("/api/plans", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/plans");
  });

  app.get("/api/announcements", async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/announcements");
  });

  // Admin stats
  app.get("/api/admin/stats", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/stats");
  });

  // Admin settings
  app.get("/api/admin/settings", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/settings");
  });

  app.post("/api/admin/settings", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/settings", req.body);
  });

  // Transactions
  app.get("/api/admin/transactions", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/transactions");
  });

  // Users
  app.get("/api/admin/users", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/users");
  });

  app.post("/api/admin/users/create", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/users/create", req.body);
  });

  app.post("/api/admin/users/promote", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/users/promote", req.body);
  });

  app.post("/api/admin/users/suspend", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/users/suspend", req.body);
  });

  // Wallet operations
  app.post("/api/admin/wallet/credit", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/wallet/credit", req.body);
  });

  app.post("/api/admin/wallet/debit", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/wallet/debit", req.body);
  });

  app.post("/api/admin/wallet/reverify", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/wallet/reverify", req.body);
  });

  app.get("/api/admin/wallet/logs", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/wallet/logs");
  });

  app.get("/api/admin/wallet/deposits", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/wallet/deposits");
  });

  // Support tickets
  app.get("/api/admin/support/tickets", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/support/tickets");
  });

  app.post("/api/admin/support/tickets/create", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/support/tickets/create", req.body);
  });

  app.get("/api/admin/support/tickets/:id/messages", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", `/api/admin/support/tickets/${req.params.id}/messages`);
  });

  app.post("/api/admin/support/tickets/:id/reply", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", `/api/admin/support/tickets/${req.params.id}/reply`, req.body);
  });

  app.post("/api/admin/support/tickets/:id/status", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", `/api/admin/support/tickets/${req.params.id}/status`, req.body);
  });

  app.post("/api/admin/support/tickets/:id/delete", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", `/api/admin/support/tickets/${req.params.id}/delete`);
  });

  // Announcements
  app.get("/api/admin/announcements", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/announcements");
  });

  app.post("/api/admin/announcements", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/announcements", req.body);
  });

  app.delete("/api/admin/announcements/:id", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "DELETE", `/api/admin/announcements/${req.params.id}`);
  });

  // Payments
  app.post("/api/admin/payments/reconcile", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/payments/reconcile", req.body);
  });

  // Services
  app.get("/api/admin/services", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/services");
  });

  app.post("/api/admin/services", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/services", req.body);
  });

  app.put("/api/admin/services/:id", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "PUT", `/api/admin/services/${req.params.id}`, req.body);
  });

  app.delete("/api/admin/services/:id", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "DELETE", `/api/admin/services/${req.params.id}`);
  });

  // Admin management
  app.get("/api/admin/admins", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/admins");
  });

  app.post("/api/admin/admins", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/admins", req.body);
  });

  // Profile
  app.get("/api/admin/profile", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "GET", "/api/admin/profile");
  });

  app.post("/api/admin/profile/update", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/profile/update", req.body);
  });

  app.post("/api/admin/profile/password", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/profile/password", req.body);
  });

  // Verification
  app.post("/api/admin/users/verification-link", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/users/verification-link", req.body);
  });

  // Wallet fix
  app.post("/api/admin/wallet/fix-ghosts", adminAuth, async (req: Request, res: Response) => {
    await proxyRequest(req, res, "POST", "/api/admin/wallet/fix-ghosts");
  });

}
