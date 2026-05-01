"use client";

import { useEffect, useState } from "react";
import { useT } from "@/app/i18n/client";
import { I18nextInstance, StateSetter } from "@/app/lib/constants";
import { getHello } from "@/app/services/v1/app";
import SkipToContent from "./SkipToContent";
import Header from "./Header";
import Main from "./Main";
import Section from "./Section";
import Footer from "./Footer";

export default function Page(): React.ReactNode {
  const { i18n }: I18nextInstance = useT("app", {});
  const [hydrated, setHydrated]: StateSetter<boolean> = useState<boolean>(false);

  useEffect((): void => {
    const fetchHello = async () => {
      const response = await getHello(i18n);
      if (response.ok) {
        console.log(response);
        const responseString: string = await response.text();
        console.log(responseString);
      }
      setHydrated(true);
    };
    fetchHello();
  }, [i18n]);

  if (!hydrated) return null;
  return (
    <div className="bg-[var(--theme-bg-base)] items-center font-[family-name:var(--font-geist-sans)]">
      <SkipToContent />
      <Header />
      <Main />
      <Section />
      <Footer />
    </div>
  );
};
