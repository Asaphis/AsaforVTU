import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowRightLeft,
  Server,
  Settings,
  User,
  FileText,
  TrendingUp,
  LogOut,
  MessageSquare
} from "lucide-react";
import { signOut } from "@/lib/firebase";
// Use the brand logo
const logoUrl = "/logo.png";

export function Sidebar() {
  const [location] = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "User Management", href: "/users" },
    { icon: Wallet, label: "Wallet Funding", href: "/wallet" },
    { icon: ArrowRightLeft, label: "Transactions", href: "/transactions" },
    { icon: TrendingUp, label: "Financial Intelligence", href: "/finance" },
    { icon: Server, label: "VTU Services", href: "/services" },
    { icon: MessageSquare, label: "Support", href: "/support" },
    { icon: Settings, label: "API Settings", href: "/settings/api" },
    { icon: FileText, label: "System Logs", href: "/logs" },
    { icon: User, label: "My Profile", href: "/profile" },
  ];

  return (
    <aside className="fixed left-4 top-4 bottom-4 z-40 w-64 rounded-[2.5rem] border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-2xl transition-all duration-500">
      <div className="flex h-24 items-center justify-center px-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center">
            <img src={logoUrl} alt="AsaforVTU Logo" className="h-full w-full object-contain animate-pulse" />
          </div>
          <span className="font-black text-2xl bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">AsaforVTU</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-8rem)] flex-col justify-between px-4 py-4">
        <nav className="space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center rounded-[1.5rem] px-4 py-3 text-sm font-bold transition-all duration-300",
                    isActive
                      ? "bg-primary text-white shadow-xl shadow-primary/25 translate-x-1"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary hover:translate-x-1"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                    )}
                  />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

