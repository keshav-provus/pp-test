"use client";

import { useTheme } from "next-themes";
import { LogOut, User, Sun, Moon, Layers } from "lucide-react";
import { useEffect, useState } from "react";

interface NavbarProps {
  firstName: string;
  email: string;
  onLogout: () => void;
}

export const Navbar = ({ firstName, email, onLogout }: NavbarProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-[#1d2125] border-b border-gray-200 dark:border-[#2c333a] transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#0052cc] text-white flex items-center justify-center shadow-sm">
            <Layers size={16} />
          </div>
          <span className="font-semibold text-[#172b4d] dark:text-[#b6c2cf] tracking-tight">
            Planning Poker
          </span>
        </div>

        {/* User Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-[#9fadbc] dark:hover:bg-[#a6c5e2]/10 rounded transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="h-5 w-px bg-gray-300 dark:bg-[#2c333a] mx-1" />

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end mr-1">
              <span className="text-sm font-medium text-[#172b4d] dark:text-[#b6c2cf] leading-tight hidden sm:block">
                {firstName}
              </span>
              {/* Fix: Utilized the unused email prop */}
              {email && (
                <span className="text-[10px] text-gray-500 dark:text-[#8c9bab] hidden sm:block">
                  {email}
                </span>
              )}
            </div>
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#2c333a] text-gray-600 dark:text-[#b6c2cf] flex items-center justify-center border border-gray-200 dark:border-transparent">
              <User size={14} />
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-[#9fadbc] dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded transition-colors ml-1"
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