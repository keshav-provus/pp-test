import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  firstName: string;
  email: string;
  onLogout: () => void;
}

export function Navbar({ firstName, email, onLogout }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <span className="font-bold text-black text-sm">P</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">
            Provus<span className="text-lime-400">Poker</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 pr-1 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex flex-col text-right leading-tight">
              <span className="text-sm font-medium">{firstName}</span>
              <span className="text-[10px] text-muted-foreground">{email.split("@")[1]}</span>
            </div>
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarFallback className="bg-gradient-to-br from-lime-400 to-lime-600 text-black font-bold">
                {firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors" 
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}