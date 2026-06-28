"use client";

import { createContext, useContext } from "react";
import { ResponsiveState, useResponsive } from "@/app/hooks/use-responsive";
import { ThemeState, useTheme } from "@/app/hooks/use-theme";
import { THEME_KEYS, FALLBACK_4K_SCREEN_WIDTH } from "@/app/lib/constants";

export interface ResponsiveContextValue {
  width: number;
  isTabletScreen: boolean;
  isMobileScreen: boolean;
  actualTheme: string;
  userPreferenceTheme: string
};

const defaultValue: ResponsiveContextValue = {
  width: FALLBACK_4K_SCREEN_WIDTH,
  isTabletScreen: false,
  isMobileScreen: false,
  actualTheme: THEME_KEYS.LIGHT,
  userPreferenceTheme: THEME_KEYS.SYSTEM
};

const ResponsiveContext: React.Context<ResponsiveContextValue> = createContext<ResponsiveContextValue>(defaultValue);

export const useResponsiveContext: () => ResponsiveContextValue = (): ResponsiveContextValue => useContext<ResponsiveContextValue>(ResponsiveContext);

export default function ResponsiveProvider({
  children
}: {
  children: React.ReactNode
}): React.ReactNode {
  const { width, isTabletScreen, isMobileScreen }: ResponsiveState = useResponsive();
  const { actualTheme, userPreferenceTheme }: ThemeState = useTheme();
  return (
    <ResponsiveContext.Provider
      value={{
        width, isTabletScreen, isMobileScreen,
        actualTheme, userPreferenceTheme
      }}
    >
      {children}
    </ResponsiveContext.Provider>
  );
};
