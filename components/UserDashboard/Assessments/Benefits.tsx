import { useTranslations } from "next-intl";
import React from "react";

export default function Benefits() {
  const t = useTranslations("assessment");
  return (
    <div className="mt-12">
      <h4 className="text-2xl font-bold text-teal-400 mb-6 flex items-center gap-2">
        🌟 {t("keyBenefits")}
      </h4>
      <p className="text-slate-300 mb-4">
        Discover the transformative advantages of adopting a rainwater
        harvesting system. From cost savings to environmental impact, here’s why
        it’s a game-changer:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: "Save on Water Bills",
            description:
              "Reduce your water expenses by up to 40% annually with efficient rainwater utilization.",
            icon: "💧",
          },
          {
            title: "Recharge Groundwater",
            description:
              "Help replenish local aquifers and contribute to sustainable water management.",
            icon: "🌍",
          },
          {
            title: "Eco-Friendly Solution",
            description:
              "Adopt a green initiative that reduces dependency on municipal water supply.",
            icon: "🌱",
          },
          {
            title: "Subsidy Benefits",
            description:
              "Eligible for government subsidies, making it a cost-effective investment.",
            icon: "💸",
          },
          {
            title: "IoT Monitoring",
            description:
              "Leverage smart IoT solutions for real-time water usage tracking and analytics.",
            icon: "📡",
          },
          {
            title: "Drought Resilience",
            description:
              "Ensure water availability during dry spells and build resilience against climate change.",
            icon: "☀️",
          },
        ].map((benefit, i) => (
          <div
            key={i}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-sky-950/70 to-slate-700 border border-slate-600 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{benefit.icon}</span>
              <h5 className="text-lg font-bold text-teal-300">
                {benefit.title}
              </h5>
            </div>
            <p className="text-slate-400 mt-2">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
