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
      <h2
        className="text-3xl font-bold mb-6 flex items-center gap-2 text-teal-400 drop-shadow"
        id="overview"
        data-tab="assessment"
      >
        {t("dashboardOverview")}
      </h2>
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: t("rooftopArea"), value: rooftop.area + " sq. ft." },
          { title: t("rooftopType"), value: rooftop.type },
          { title: t("availableSpace"), value: rooftop.space + " sq. ft." },
          { title: t("noOfDwellers"), value: rooftop.dwellers },
        ].map((item, i) => (
          <div
            key={i}
            className="relative p-6 rounded-2xl bg-slate-900/70 backdrop-blur-lg border border-slate-700 shadow-lg hover:shadow-xl transition"
          >
            <h3
              className="text-lg font-semibold text-slate-200"
              id={"rooftop-" + i}
              data-tab="assessment"
            >
              {item.title}
            </h3>
            <p className="text-2xl font-bold mt-2 text-teal-400">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
