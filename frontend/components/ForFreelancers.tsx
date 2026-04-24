"use client";

import { useTranslation } from "react-i18next";
import SubmitInvoiceForm from "./SubmitInvoiceForm";

export default function ForFreelancers() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("landing.freelancerFeatures.instantLiquidity"),
      description: t("landing.freelancerFeatures.instantLiquidityDesc"),
    },
    {
      title: t("landing.freelancerFeatures.transparentPricing"),
      description: t("landing.freelancerFeatures.transparentPricingDesc"),
    },
    {
      title: t("landing.freelancerFeatures.globalMarket"),
      description: t("landing.freelancerFeatures.globalMarketDesc"),
    },
  ];

  return (
    <section id="for-freelancers" className="bg-surface-container-low py-24 px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-4xl font-headline mb-6">
            {t("landing.forFreelancersTitle")}
          </h2>
          <p className="text-on-surface-variant text-base max-w-xl mb-8 leading-relaxed">
            {t("landing.forFreelancersSubtitle")}
          </p>
          <ul className="space-y-6">
            {features.map((feature, index) => (
              <li key={index} className="flex gap-4">
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div>
                  <p className="font-bold">{feature.title}</p>
                  <p className="text-on-surface-variant text-sm">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <SubmitInvoiceForm />
      </div>
    </section>
  );
}