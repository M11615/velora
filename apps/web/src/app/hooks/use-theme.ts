import { useEffect, useState } from "react";
import { StateSetter, THEME_KEYS } from "@/app/lib/constants";

export interface ThemeState {
  actualTheme: string;
  userPreferenceTheme: string;
};

export const useTheme: () => ThemeState = (): ThemeState => {
  const [state, setState]: StateSetter<ThemeState> = useState<ThemeState>({
    actualTheme: THEME_KEYS.LIGHT,
    userPreferenceTheme: THEME_KEYS.SYSTEM
  });
  useEffect((): () => void => {
    const handleThemeChange = (e: CustomEvent): void => {
      setState({
        actualTheme: e.detail.actualTheme,
        userPreferenceTheme: e.detail.userPreferenceTheme
      });
    };
    window.addEventListener("theme-change", handleThemeChange as EventListener);
    const mediaQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      window.dispatchEvent(new CustomEvent("theme-change", {
        detail: {
          actualTheme: state.userPreferenceTheme === THEME_KEYS.SYSTEM ? (e.matches ? THEME_KEYS.DARK : THEME_KEYS.LIGHT) : state.userPreferenceTheme,
          userPreferenceTheme: state.userPreferenceTheme
        }
      }));
    };
    mediaQuery.addEventListener("change", handleSystemChange);
    return (): void => {
      window.removeEventListener("theme-change", handleThemeChange as EventListener);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);
  return state;
};
