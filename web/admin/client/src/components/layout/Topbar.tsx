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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-8 bg-white border-b border-slate-200">
      <div className="flex items-center gap-6 w-full max-w-3xl">
        <Button variant="ghost" size="icon" className="md:hidden bg-slate-100 rounded-md border border-slate-200 text-slate-700">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="relative hidden md:block w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search ecosystem..."
            className="w-full h-10 rounded-md border-slate-200 bg-white pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <Button variant="ghost" size="icon" className="relative h-10 w-10 bg-slate-100 rounded-md hover:bg-slate-200 border border-slate-200">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary border-2 border-white" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-md p-0 overflow-hidden border border-slate-200">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.photoURL || ""} alt={user?.email || "Admin"} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold text-base">
                  {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 mt-2 rounded-md bg-white border border-slate-200 text-slate-700">
            <DropdownMenuLabel className="px-3 py-2 text-slate-900 font-semibold">Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-3 py-2 cursor-pointer" onClick={() => setLocation("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem className="px-3 py-2 cursor-pointer" onClick={() => setLocation("/settings/api")}>API Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-3 py-2 text-red-600 cursor-pointer" onClick={() => signOut()}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
