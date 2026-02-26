"use client";

import { useTheme } from "next-themes";
import { LogOut, Sun, Moon, Layers } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface NavbarProps {
  firstName: string;
  email: string;
  onLogout: () => void;
}

export const Navbar = ({ firstName, email, onLogout }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  const initials = firstName ? firstName.substring(0, 2).toUpperCase() : "U";

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-[#333] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111] dark:bg-white text-white dark:text-[#111] flex items-center justify-center shadow-sm">
            <Layers size={17} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-[#111] dark:text-[#ededed] tracking-tight leading-tight">
              Planning Poker
            </span>
            <span className="text-[10px] text-[#888] dark:text-[#666] font-medium tracking-wide leading-tight hidden sm:block">
              by Provus
            </span>
          </div>
        </div>

        {/* User Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-[#888] hover:text-[#111] dark:text-[#666] dark:hover:text-[#ededed] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-md transition-all duration-200 group active:scale-[0.95]"
            title="Toggle Theme"
          >
            {mounted ? (
              theme === "dark" 
                ? <Sun size={17} className="transition-transform duration-300 group-hover:rotate-45" /> 
                : <Moon size={17} className="transition-transform duration-300 group-hover:-rotate-12" />
            ) : (
              <span className="w-[17px] h-[17px] block" />
            )}
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-[#333] mx-1" />

          {/* User section */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end mr-0.5">
              <span className="text-xs font-medium text-[#111] dark:text-[#ededed] leading-tight hidden sm:block">
                {firstName}
              </span>
              {email && (
                <span className="text-[10px] text-[#888] dark:text-[#666] hidden sm:block leading-tight">
                  {email}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] border border-gray-200 dark:border-[#333] flex items-center justify-center text-xs font-semibold shadow-sm">
              {initials}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-[#888] hover:text-[#111] hover:bg-gray-100 dark:text-[#666] dark:hover:text-[#ededed] dark:hover:bg-[#1a1a1a] rounded-md transition-all duration-200 ml-0.5 active:scale-[0.95]"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};