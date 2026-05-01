"use client";

import { useEffect, useState } from "react";
import { useT } from "@/app/i18n/client";
import { I18nextInstance, StateSetter, MAIN_CONTENT_ID } from "@/app/lib/constants";

export default function SkipToContent(): React.ReactNode {
  const { t }: I18nextInstance = useT("app", {});
  const [hydrated, setHydrated]: StateSetter<boolean> = useState<boolean>(false);

  useEffect((): void => {
    setHydrated(true);
  }, []);

  const handleSkipToContent: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.currentTarget.blur();
    const element: HTMLElement | null = document.getElementById(MAIN_CONTENT_ID);
    if (element) {
      element.focus();
      element.scrollIntoView();
    }
  };

  if (!hydrated) return null;
  return (
    <button
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => handleSkipToContent(e)}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-[7px] focus-visible:top-[11px] focus-visible:flex focus-visible:items-center focus-visible:px-[13px] focus-visible:py-[6px] rounded-[6px] select-none cursor-pointer z-70 border-[var(--theme-bg-base)] bg-[var(--theme-bg-base)] text-[16px] text-[var(--theme-primary-light)] hover:text-[var(--theme-primary-light-hover)] transition duration-200 ease-in-out"
    >
      {t("skipToContent")}
    </button>
  );
};
