"use client";

import { useTranslation } from "react-i18next";
import LPDashboard from "./LPDashboard";

export default function ForLPs() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("landing.lpFeatures.realWorldAssets"),
      description: t("landing.lpFeatures.realWorldAssetsDesc"),
    },
    {
      title: t("landing.lpFeatures.superiorYields"),
      description: t("landing.lpFeatures.superiorYieldsDesc"),
    },
    {
      title: t("landing.lpFeatures.trustlessSettlements"),
      description: t("landing.lpFeatures.trustlessSettlementsDesc"),
    },
  ];

  return (
    <section id="for-lps" className="bg-surface-dim py-24 px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="order-2 lg:order-1">
          <LPDashboard />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-4xl font-headline mb-6 text-foreground">
            {t("landing.forLPsTitle")}
          </h2>
          <ul className="space-y-6">
            {features.map((feature, index) => (
              <li key={index} className="flex gap-4">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  currency_exchange
                </span>
                <div>
                  <p className="font-bold text-foreground">{feature.title}</p>
                  <p className="text-on-surface-variant text-sm">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-12 p-8 bg-primary-container/20 rounded-2xl border border-primary/10">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              {t("landing.lpHowItWorksTitle")}
            </h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("landing.lpHowItWorksDesc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}