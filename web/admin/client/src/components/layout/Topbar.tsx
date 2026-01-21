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
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between px-8 bg-transparent">
      <div className="flex items-center gap-6 w-full max-w-4xl">
        <Button variant="ghost" size="icon" className="md:hidden bg-white shadow-md rounded-2xl">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="relative hidden md:block w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Quick search..."
            className="w-full h-12 rounded-[1.25rem] border-none bg-white shadow-sm pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="relative h-12 w-12 bg-white shadow-sm rounded-2xl hover:bg-slate-50 transition-all">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute right-3.5 top-3.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-white" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-12 rounded-2xl p-0 overflow-hidden shadow-sm border border-slate-100 transition-all hover:scale-105">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.photoURL || ""} alt={user?.email || "Admin"} />
                <AvatarFallback className="bg-primary text-white font-black">
                  {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/settings/api")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
