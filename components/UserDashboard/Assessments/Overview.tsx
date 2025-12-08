import { useTranslations } from "next-intl";
import React from "react";

interface rooftop {
  area: string;
  type: string;
  dwellers: string;
  space: string;
}
export default function Overview(rooftop: rooftop) {
  const t = useTranslations("assessment");
  return (
    <div className="relative mb-12">
      {/* Background Ambient Glow */}
      <div className="absolute -top-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-slate-500/10 rounded-full blur-[100px] pointer-events-none" />

      <h2
        className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-100 relative z-10"
        id="overview"
        data-tab="assessment"
      >
        <span className="w-1.5 h-8 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.6)]"></span>
        {t("dashboardOverview")}
      </h2>
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
        {[
          { title: t("rooftopArea"), value: rooftop.area + " sq. ft.", icon: "📐" },
          { title: t("rooftopType"), value: rooftop.type, icon: "🏠" },
          { title: t("availableSpace"), value: rooftop.space + " sq. ft.", icon: "✨" },
          { title: t("noOfDwellers"), value: rooftop.dwellers, icon: "👥" },
        ].map((item, i) => (
          <div
            key={i}
            className="group relative p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/50"
          >
            {/* Inner Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-300 pointer-events-none" />

            <div className="relative flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-medium text-slate-400 uppercase tracking-wider"
                  id={"rooftop-" + i}
                  data-tab="assessment"
                >
                  {item.title}
                </h3>
                <span className="text-xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 grayscale group-hover:grayscale-0">{item.icon}</span>
              </div>

              <p className="text-2xl font-bold mt-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-teal-400 drop-shadow-sm group-hover:text-teal-300 transition-colors">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
