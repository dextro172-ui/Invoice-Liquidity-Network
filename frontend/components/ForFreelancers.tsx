"use client";

import SubmitInvoiceForm from "./SubmitInvoiceForm";

export default function ForFreelancers() {
  const features = [
    {
      title: "Instant Liquidity",
      description: "Sell invoices and get funds in minutes, not months.",
    },
    {
      title: "Transparent Pricing",
      description: "You set the discount rate you're comfortable with.",
    },
    {
      title: "Global Market",
      description:
        "Access liquidity providers from around the world via Stellar.",
    },
  ];

  return (
    <section id="for-freelancers" className="bg-surface-container-low py-24 px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-4xl font-headline mb-6">
            Get paid today, not in 90 days.
          </h2>
          <p className="text-on-surface-variant text-base max-w-xl mb-8 leading-relaxed">
            This form is the on-chain entry point for freelancers in ILN. Connect Freighter, price the invoice, and publish it directly to the Soroban contract on Stellar testnet.
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
