"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ColorContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider = ({ children }: { children: React.ReactNode }) => {
  const [primaryColor, setPrimaryColor] = useState('#84cc16'); // Default Lime

  const updateCssVariables = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    const h_deg = Math.round(h * 360);
    const s_pct = Math.round(s * 100);
    const l_pct = Math.round(l * 100);

    const root = document.documentElement;
    root.style.setProperty('--primary', `${h_deg} ${s_pct}% ${l_pct}%`);
    
    // Auto-calculate foreground contrast
    const isLight = l_pct > 65; 
    root.style.setProperty('--primary-foreground', isLight ? '222 47% 11%' : '0 0% 100%');
  }, []);

  useEffect(() => {
    const savedColor = localStorage.getItem('poker-primary-color');
    if (savedColor) {
      setPrimaryColor(savedColor);
      updateCssVariables(savedColor);
    }
  }, [updateCssVariables]);

  useEffect(() => {
    localStorage.setItem('poker-primary-color', primaryColor);
    updateCssVariables(primaryColor);
  }, [primaryColor, updateCssVariables]);

  return (
    <ColorContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColor = () => {
  const context = useContext(ColorContext);
  if (!context) throw new Error('useColor must be used within ColorProvider');
  return context;
};