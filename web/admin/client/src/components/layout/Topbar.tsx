import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth, signOut } from "@/lib/firebase";
import { useLocation } from "wouter";

export function Topbar() {
  const user = auth.currentUser || undefined;
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-30 flex h-24 w-full items-center justify-between px-12 bg-transparent backdrop-blur-sm">
      <div className="flex items-center gap-8 w-full max-w-4xl">
        <Button variant="ghost" size="icon" className="md:hidden bg-white/5 shadow-2xl rounded-2xl border border-white/10 text-white">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="relative hidden md:block w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Search ecosystem..."
            className="w-full h-14 rounded-[1.5rem] border-0 bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl pl-14 pr-6 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-white/10 transition-all duration-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <Button variant="ghost" size="icon" className="relative h-14 w-14 bg-white/5 shadow-2xl rounded-2xl hover:bg-white/10 transition-all border border-white/10 group">
          <Bell className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
          <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-primary border-2 border-[#0F172A] shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-14 w-14 rounded-2xl p-0 overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all hover:scale-105 active:scale-95">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.photoURL || ""} alt={user?.email || "Admin"} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-black text-lg">
                  {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mt-4 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border-white/10 shadow-3xl text-slate-300">
            <DropdownMenuLabel className="px-4 py-3 text-white font-black text-base italic">Command Center</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="px-4 py-3 rounded-xl focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => setLocation("/profile")}>Admin Profile</DropdownMenuItem>
            <DropdownMenuItem className="px-4 py-3 rounded-xl focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => setLocation("/settings/api")}>API Configuration</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="px-4 py-3 rounded-xl text-red-400 focus:bg-red-500/10 focus:text-red-400 font-bold cursor-pointer" onClick={() => signOut()}>
              Terminate Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
