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

export default function Cost(props: Props) {
  return (
    <div className="mt-12 mb-12">
      <h4 className="text-2xl font-semibold text-amber-400 mb-6 border-b border-amber-700 pb-2">
        Cost Estimation & Benefits
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Installation & Maintenance Cost */}
        <div className="bg-gradient-to-br from-amber-900/60 to-slate-900/80 p-6 rounded-2xl border border-amber-700 shadow-lg">
          <h5 className="text-xl font-bold text-amber-400 mb-4">
            Estimated Costs
          </h5>
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="flex justify-between">
              <span>Installation Cost (CAPEX):</span>
              <span className="font-semibold text-slate-100">
                {/* Prefer Firestore costBenefit, then older costEstimate, then default */}
                {props?.costBenefit?.installationCost_INR
                  ? `₹ ${props.costBenefit.installationCost_INR.toLocaleString()}`
                  : props?.costEstimate?.CAPEX
                  ? `₹ ${props.costEstimate.CAPEX.toLocaleString()}`
                  : "₹ 1,20,000"}
              </span>
            </li>

            {/* Material & labour cost from old costEstimate, kept optional */}
            {props?.costEstimate?.materialCost && (
              <li className="flex justify-between">
                <span>Material Cost:</span>
                <span className="font-semibold text-slate-100">
                  ₹ {props.costEstimate.materialCost.toLocaleString()}
                </span>
              </li>
            )}
            {props?.costEstimate?.labourCost && (
              <li className="flex justify-between">
                <span>Labour Cost:</span>
                <span className="font-semibold text-slate-100">
                  ₹ {props.costEstimate.labourCost.toLocaleString()}
                </span>
              </li>
            )}

            <li className="flex justify-between">
              <span>Annual Maintenance:</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.annualMaintenance_INR
                  ? `₹ ${props.costBenefit.annualMaintenance_INR.toLocaleString()}`
                  : "₹ 5,000"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Expected Lifespan:</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.expectedLifespan_years
                  ? `${props.costBenefit.expectedLifespan_years}+ Years`
                  : "15+ Years"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Net Upfront Cost (after subsidy):</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.netUpfrontCostAfterSubsidy_INR
                  ? `₹ ${props.costBenefit.netUpfrontCostAfterSubsidy_INR.toLocaleString()}`
                  : "—"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Subsidy Amount:</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.subsidyAmount_INR
                  ? `₹ ${props.costBenefit.subsidyAmount_INR.toLocaleString()}`
                  : "—"}
              </span>
            </li>
          </ul>
        </div>

        {/* Cost-Benefit Analysis */}
        <div className="bg-gradient-to-br from-teal-900/60 to-slate-900/80 p-6 rounded-2xl border border-teal-700 shadow-lg">
          <h5 className="text-xl font-bold text-teal-400 mb-4">
            Benefits & Savings
          </h5>
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="flex justify-between">
              <span>Annual Water Bill Savings:</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.annualWaterBillSavings_INR
                  ? `₹ ${props.costBenefit.annualWaterBillSavings_INR.toLocaleString()}`
                  : props?.costEstimate?.annualSavings
                  ? `₹ ${props.costEstimate.annualSavings.toLocaleString()}`
                  : "₹ 25,000"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Subsidy Eligible:</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.subsidyEligible === true
                  ? "Yes"
                  : props?.costBenefit?.subsidyEligible === false
                  ? "No"
                  : "Yes (Up to 30%)"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Payback Period:</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.paybackPeriod_years
                  ? `~ ${props.costBenefit.paybackPeriod_years} Years`
                  : props?.costEstimate?.paybackPeriod
                  ? `~ ${props.costEstimate.paybackPeriod} Years`
                  : "~ 4.5 Years"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Return on Investment (10 Yrs):</span>
              <span className="font-semibold text-slate-100">
                {props?.costBenefit?.roi10yr_multiple != null
                  ? `${props.costBenefit.roi10yr_multiple.toFixed(1)}x`
                  : props?.costEstimate?.paybackPeriod &&
                    props.costEstimate.paybackPeriod > 0
                  ? `${(10 / props.costEstimate.paybackPeriod).toFixed(1)}x`
                  : "3.2x"}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
