"use client";

import React, { KeyboardEvent } from "react";
import { FiSearch } from "react-icons/fi";

interface JqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  className?: string;
  placeholder?: string;
}

export const JqlEditor = ({ value, onChange, onSearch, className = "", placeholder = "Enter JQL query..." }: JqlEditorProps) => {

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#22272b] border border-gray-200 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#0052cc] transition-colors font-mono"
        spellCheck={false}
      />
    </div>
  );
};
