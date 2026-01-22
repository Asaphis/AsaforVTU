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
    <aside className="fixed left-6 top-6 bottom-6 z-40 w-72 rounded-[2rem] border border-slate-200/60 bg-white/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden flex flex-col">
      <div className="flex h-28 items-center px-8 border-b border-slate-50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
            <img src={logoUrl} alt="AsaforVTU Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-slate-900 leading-none">Asafor<span className="text-primary">VTU</span></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Portal</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 overflow-hidden">
        <nav className="space-y-1 overflow-y-auto no-scrollbar pr-2">
          {menuItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300 relative",
                    isActive
                      ? "bg-primary text-white shadow-xl shadow-primary/25 translate-x-1"
                      : "text-slate-500 hover:bg-slate-50 hover:text-primary hover:translate-x-1"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-4 h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <span className="absolute left-0 w-1 h-6 bg-white/40 rounded-r-full -translate-x-1" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-slate-50">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-2xl px-5 py-4 text-sm font-bold text-red-500 transition-all hover:bg-red-50 hover:translate-x-1 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-4 group-hover:bg-red-100 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            Sign Out Account
          </button>
        </div>
      </div>
    </aside>
  );
}

