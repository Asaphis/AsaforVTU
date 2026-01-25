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

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
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
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 w-64 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200",
        "md:translate-x-0",
        open ? "translate-x-0" : "translate-x-[-100%] md:translate-x-0"
      )}
      aria-hidden={!open && typeof window !== "undefined" && window.innerWidth < 768}
    >
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="AsaforVTU Logo" className="h-8 w-8 object-contain" />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900">AsaforVTU</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Control Center</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <nav className="space-y-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => onClose && onClose()}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-primary" : "text-slate-500 group-hover:text-primary"
                    )}
                  />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

