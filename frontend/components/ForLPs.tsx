export default function ForLPs() {
  const marketplaceData = [
    { amount: "$12,400", discount: "2.8%", yield: "14.2% APR" },
    { amount: "$4,500", discount: "4.0%", yield: "11.8% APR" },
    { amount: "$2,100", discount: "3.2%", yield: "13.5% APR" },
  ];

  const features = [
    {
      title: "Real World Assets",
      description:
        "Diversify your crypto holdings into invoice factoring, a $3T global market.",
    },
    {
      title: "Superior Yields",
      description:
        "Capture spreads far exceeding standard DeFi lending protocols.",
    },
    {
      title: "Trustless Settlements",
      description:
        "Smart contracts handle the escrow and distribution on Stellar.",
    },
  ];

  return (
    <section className="bg-surface-dim py-24 px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div className="order-2 md:order-1">
          {/* Dashboard Mockup */}
          <div className="bg-surface rounded-xl shadow-xl overflow-hidden border border-outline-variant/10">
            <div className="p-6 border-b border-surface-dim flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  monitoring
                </span>
                Marketplace
              </h3>
              <span className="text-xs font-bold text-primary px-2 py-1 bg-primary-fixed-dim/20 rounded">
                Live Feed
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-on-surface-variant">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-on-surface-variant">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-on-surface-variant">
                      Yield
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {marketplaceData.map((item, index) => (
                    <tr key={index} className="border-b border-surface-dim">
                      <td className="px-6 py-4 font-medium">{item.amount}</td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {item.discount}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-bold">
                        {item.yield}
                      </td>
                      <td className="px-6 py-4">
                        <button className="bg-primary text-white text-xs px-3 py-1.5 rounded font-bold">
                          Fund
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-4xl font-headline mb-6">
            Earn real yield backed by real business.
          </h2>
          <ul className="space-y-6">
            {features.map((feature, index) => (
              <li key={index} className="flex gap-4">
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  currency_exchange
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
      </div>
    </section>
  );
}
