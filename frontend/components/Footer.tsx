"use client";

import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary-container py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-primary mb-6">ILN</div>
            <p className="text-on-primary-container/70 max-w-xs mb-8 font-body text-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-on-primary-container/10 flex items-center justify-center text-on-primary-container hover:bg-on-primary-container/20 transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-on-primary-container/10 flex items-center justify-center text-on-primary-container hover:bg-on-primary-container/20 transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">
                  terminal
                </span>
              </a>
            </div>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-6">
              {t("footer.network")}
            </h5>
            <ul className="space-y-4 text-sm text-on-primary-container/80">
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.howItWorks")}
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.forFreelancers")}
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.forLPs")}
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.dashboard")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-6">
              {t("footer.developers")}
            </h5>
            <ul className="space-y-4 text-sm text-on-primary-container/80">
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.documentation")}
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.githubRepository")}
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.technicalSpecs")}
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  {t("footer.openSourcePolicy")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-on-primary-container/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary-container/60">
          <div className="flex items-center gap-4">
            <span>{t("footer.builtOnStellar")}</span>
            <span>•</span>
            <span>{t("footer.mitLicense")}</span>
          </div>
          <div>{t("footer.copyright")}</div>
        </div>
      </div>
    </footer>
  );
}