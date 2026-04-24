"use client";

import { useTranslation } from "react-i18next";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      title: t("landing.steps.submitInvoice"),
      description: t("landing.steps.submitInvoiceDesc"),
    },
    {
      title: t("landing.steps.fundAsLP"),
      description: t("landing.steps.fundAsLPDesc"),
    },
    {
      title: t("landing.steps.protocolSettle"),
      description: t("landing.steps.protocolSettleDesc"),
    },
  ];

  return (
    <section className="bg-surface-container-low py-24 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-headline mb-16 text-center">
          {t("landing.howItWorksTitle")}
        </h2>
        <div className="grid md:grid-cols-3 gap-12 relative mb-24">
          {steps.map((step, index) => (
            <div key={index} className="relative z-10">
              <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold mb-6">
                {index + 1}
              </div>
              <h3 className="text-xl font-headline mb-3">{step.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-highest p-8 md:p-12 rounded-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/40">
          <div className="text-center">
            <div className="text-xs font-bold mb-2 uppercase text-on-surface-variant">
              {t("landing.flowDiagram.liquidityProvider")}
            </div>
            <div className="text-2xl font-headline font-medium">$1,000</div>
            <div className="text-xs text-primary mt-1">{t("landing.flowDiagram.capitalOut")}</div>
          </div>
          <div className="flex-1 h-[2px] bg-outline-variant relative flex items-center justify-center w-full">
            <span className="absolute right-0 w-2 h-2 bg-outline-variant rotate-45 border-t border-r -mr-1"></span>
            <div className="bg-primary text-surface-container-lowest text-[10px] px-2 py-1 rounded-full -mt-8 font-bold whitespace-nowrap">
              DISCOUNT: 3%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold mb-2 uppercase text-on-surface-variant">
              {t("landing.flowDiagram.freelancer")}
            </div>
            <div className="text-2xl font-headline font-medium">$970</div>
            <div className="text-xs text-primary mt-1">{t("landing.flowDiagram.instantCash")}</div>
          </div>
          <div className="flex-1 h-[2px] bg-outline-variant relative flex items-center justify-center w-full">
            <span className="absolute right-0 w-2 h-2 bg-outline-variant rotate-45 border-t border-r -mr-1"></span>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold mb-2 uppercase text-on-surface-variant">
              {t("landing.flowDiagram.payerSettles")}
            </div>
            <div className="text-2xl font-headline font-medium">$1,000</div>
            <div className="text-xs text-primary mt-1">{t("landing.flowDiagram.toLP")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}