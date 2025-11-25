import { useTranslations } from "next-intl";
import React from "react";

interface Props {
  costBenefit?: {
    installationCost_INR: number;
    annualMaintenance_INR: number;
    expectedLifespan_years: number;
    annualWaterBillSavings_INR: number;
    subsidyEligible: boolean;
    subsidyRate_fraction: number;
    subsidyAmount_INR: number;
    netUpfrontCostAfterSubsidy_INR: number;
    paybackPeriod_years: number | null;
    roi10yr_multiple: number | null;
  };

  costEstimate?: {
    CAPEX: number;
    materialCost: number;
    labourCost: number;
    annualSavings: number;
    paybackPeriod: number;
    waterTariff: number;
  };
}

export default function ROI(props: Props) {
  const t = useTranslations("assessment");

  const payback =
    props?.costBenefit?.paybackPeriod_years ??
    props?.costEstimate?.paybackPeriod ??
    2;

  return (
    <div className="bg-gradient-to-r from-teal-900/60 to-indigo-900/60 p-6 rounded-2xl border border-teal-700 shadow-xl hover:scale-[1.01] transition">
      <h4 className="text-xl font-semibold text-teal-300">
        ⏳ {t("roiHeading")}
      </h4>
      <p className="text-lg mt-2 text-slate-200">
        Your system will pay for itself in around{" "}
        <span className="text-teal-400 font-bold">
          {typeof payback === "number"
            ? `${payback} years`
            : "2 years"}
        </span>
        .
      </p>
    </div>
  );
}
