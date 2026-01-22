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
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-72 border-r border-slate-200 bg-white transition-all duration-300 overflow-hidden flex flex-col">
      <div className="flex h-20 items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 p-1.5">
            <img src={logoUrl} alt="AsaforVTU Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-tight text-slate-900 leading-none">AsaforVTU</span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Admin</span>
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
                    "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className={cn("absolute left-0 inset-y-0 w-[3px] rounded-r-sm", isActive ? "bg-primary" : "bg-transparent")} />
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-primary" : "text-slate-500 group-hover:text-primary"
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 group"
          >
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
              <LogOut className="h-4 w-4 text-slate-600 group-hover:text-red-600" />
            </div>
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

