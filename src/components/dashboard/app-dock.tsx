"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, LogIn, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dock, DockIcon } from "@/components/ui/dock";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface AppDockProps {
  onLogout: () => void;
}

export function AppDock({ onLogout }: AppDockProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  if (pathname.includes("/dashboard/voting")) {
    return null; // Hide dock inside active voting session
  }

  return (
    <div className="sticky top-0 z-[100] flex justify-center py-3 bg-background/80 backdrop-blur-md border-b border-border">
      <TooltipProvider>
        <Dock direction="middle" className="bg-card/90 backdrop-blur-xl border border-border shadow-lg shadow-black/10 dark:shadow-black/40">
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  aria-label="Home"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                  )}
                >
                  <Home className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/create"
                  aria-label="Create Session"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                  )}
                >
                  <PlusCircle className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Session</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>

          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/join"
                  aria-label="Join Session"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                  )}
                >
                  <LogIn className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Join Session</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>

          <Separator orientation="vertical" className="h-full bg-border mx-2" />

          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle Theme"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                  )}
                >
                  {mounted ? (
                    theme === "dark" 
                      ? <Sun className="size-5 transition-transform duration-300 hover:rotate-45" /> 
                      : <Moon className="size-5 transition-transform duration-300 hover:-rotate-12" />
                  ) : (
                    <span className="size-5 block" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Theme</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>

          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  aria-label="Logout"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                  )}
                >
                  <LogOut className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>

        </Dock>
      </TooltipProvider>
    </div>
  );
}
