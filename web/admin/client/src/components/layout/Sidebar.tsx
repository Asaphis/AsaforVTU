import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Users2,
  Banknote,
  History,
  Package,
  Sliders,
  UserCircle,
  Terminal,
  BarChart3,
  LogOut,
  LifeBuoy
} from "lucide-react";
import { signOut } from "@/lib/firebase";

// Use the brand logo
const logoUrl = "/logo.png";

export function Sidebar() {
  const [location] = useLocation();

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Users2, label: "User Management", href: "/users" },
    { icon: Banknote, label: "Wallet Funding", href: "/wallet" },
    { icon: History, label: "Transactions", href: "/transactions" },
    { icon: BarChart3, label: "Financial Intel", href: "/finance" },
    { icon: Package, label: "VTU Services", href: "/services" },
    { icon: LifeBuoy, label: "Support Center", href: "/support" },
    { icon: Sliders, label: "API Settings", href: "/settings/api" },
    { icon: Terminal, label: "System Logs", href: "/logs" },
    { icon: UserCircle, label: "My Profile", href: "/profile" },
  ];

  return (
    <aside className="fixed left-6 top-6 bottom-6 z-40 w-72 rounded-[2.5rem] border border-white/20 bg-slate-900/90 backdrop-blur-3xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 overflow-hidden flex flex-col">
      <div className="flex h-28 items-center px-8 border-b border-white/5">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-primary to-purple-600 p-2 shadow-2xl shadow-primary/40 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
            <img src={logoUrl} alt="AsaforVTU Logo" className="h-full w-full object-contain brightness-0 invert" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none italic">Asafor<span className="text-primary-foreground/90">VTU</span></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-70">Control Center</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 overflow-hidden">
        <nav className="space-y-1.5 overflow-y-auto no-scrollbar pr-2">
          {menuItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-white/10 text-white shadow-inner shadow-white/5 ring-1 ring-white/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-y-2 left-0 w-1 bg-primary rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "mr-4 h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary" : "text-slate-500 group-hover:text-primary"
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-2xl px-5 py-4 text-sm font-bold text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:translate-x-1 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-4 group-hover:bg-red-500/20 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            Sign Out Securely
          </button>
        </div>
      </div>
    </aside>
  );
}

