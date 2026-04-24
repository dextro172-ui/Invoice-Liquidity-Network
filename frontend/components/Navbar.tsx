"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../hooks/useTheme";
import WalletButton from "./WalletButton";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  useWallet();
  const { theme, toggleTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const currentLang = i18n.language === "es" ? "es" : "en";

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/15 shadow-sm h-20 transition-colors duration-300">
      <div className="flex justify-between items-center px-8 h-full max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-primary tracking-tight hover:opacity-80 transition-opacity">
          ILN
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-on-surface-variant hover:text-primary text-sm font-medium" href="#">
            {t("nav.howItWorks")}
          </a>
          <Link
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="/freelancer"
          >
            {t("nav.forFreelancers")}
          </Link>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="#for-lps"
          >
            {t("nav.forLPs")}
          </a>
          <Link
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="/governance"
          >
            {t("nav.governance")}
          </Link>
          <Link
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="/payer"
          >
            {t("nav.payInvoices")}
          </Link>
          <Link
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="/dashboard"
          >
            {t("nav.dashboard")}
          </Link>
          <Link
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="/analytics"
          >
            {t("nav.analytics")}
          </Link>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="#"
          >
            {t("nav.docs")}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 rounded-full hover:bg-surface-variant transition-colors"
              aria-label={t("language.select")}
              aria-expanded={langOpen}
            >
              <span className="material-symbols-outlined">globe</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50">
                <button
                  onClick={() => changeLanguage("en")}
                  className={`w-full px-4 py-3 text-sm text-left hover:bg-surface-variant transition-colors flex items-center gap-3 ${
                    currentLang === "en" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
                  }`}
                >
                  <span className="text-base">🇺🇸</span>
                  {t("language.en")}
                </button>
                <button
                  onClick={() => changeLanguage("es")}
                  className={`w-full px-4 py-3 text-sm text-left hover:bg-surface-variant transition-colors flex items-center gap-3 ${
                    currentLang === "es" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
                  }`}
                >
                  <span className="text-base">🇪🇸</span>
                  {t("language.es")}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors"
            aria-label="Toggle dark mode"
          >
            <span className="material-symbols-outlined">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <WalletButton />
        </div>

      </div>
    </nav>
  );
}