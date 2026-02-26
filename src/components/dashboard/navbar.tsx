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
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#1d2125]/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-[#2c333a]/80 transition-all">
      {/* Gradient accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] brand-gradient opacity-80" />

      <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052cc] to-[#2684ff] text-white flex items-center justify-center shadow-md shadow-[#0052cc]/20">
            <Layers size={17} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] text-[#172b4d] dark:text-[#dfe1e6] tracking-tight leading-tight">
              Planning Poker
            </span>
            <span className="text-[10px] text-gray-400 dark:text-[#626f86] font-medium uppercase tracking-widest leading-tight hidden sm:block">
              by Provus
            </span>
          </div>
        </div>

        {/* User Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-500 hover:text-[#172b4d] dark:text-[#9fadbc] dark:hover:text-[#dfe1e6] hover:bg-gray-100 dark:hover:bg-[#a6c5e2]/10 rounded-lg transition-all duration-200 group"
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

          <div className="h-6 w-px bg-gray-200 dark:bg-[#2c333a] mx-1" />

          {/* User section */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end mr-0.5">
              <span className="text-[13px] font-semibold text-[#172b4d] dark:text-[#dfe1e6] leading-tight hidden sm:block">
                {firstName}
              </span>
              {email && (
                <span className="text-[10px] text-gray-400 dark:text-[#626f86] hidden sm:block leading-tight">
                  {email}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052cc] to-[#6554c0] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {initials}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-[#626f86] dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200 ml-0.5"
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