import { useTranslations } from "next-intl";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// interface Props {
//   report: {
//     feasibilityScore: number;
//     category: "High" | "Moderate" | "Low";
//     breakdown: {
//       roofScore: number;
//       openSpaceScore: number;
//       rainfallScore: number;
//       gwScore: number;
//       soilScore: number;
//     };
//     environmentalImpact: {
//       co2Saved_kg_per_year: number;
//       groundwaterRecharge_litres_per_year: number;
//       tankerTripsAvoided_per_year: number;
//       sustainabilityRating: number;
//       groundwaterDependencyReduction_pct: number;
//       perCapitaWaterSaved_litres_per_year: number;
//       householdsEquivalentWaterServed: number;
//       energySaved_kWh_per_year: number;
//       descriptionBullets: [
//         {
//           length: number;
//         }
//       ];
//     };
//   };
// }

interface Props {
  environmentalImpact:
    | {
        co2Saved_kg_per_year: number;
        groundwaterRecharge_litres_per_year: number;
        tankerTripsAvoided_per_year: number;
        sustainabilityRating:
          | "Excellent"
          | "Good"
          | "Fair"
          | "Needs Improvement";
        groundwaterDependencyReduction_pct: number;
        perCapitaWaterSaved_litres_per_year: number | null;
        householdsEquivalentWaterServed: number;
        energySaved_kWh_per_year: number;
        descriptionBullets: string[];
      }
    | undefined;
}

export default function Usage(props: Props) {
  const t = useTranslations("assessment");

  // helper: ensure a value is a finite number, otherwise return 0
  const safeNum = (v: unknown) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-teal-300">
          {t("environmentalImpact")}
        </h3>

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={
                props?.environmentalImpact
                  ? [
                      {
                        name: "CO₂ saved (kg/yr)",
                        value: safeNum(
                          props.environmentalImpact.co2Saved_kg_per_year
                        ),
                      },
                      {
                        name: "GW recharge (kL/yr)",
                        value:
                          safeNum(
                            props.environmentalImpact
                              .groundwaterRecharge_litres_per_year
                          ) / 1000,
                      },
                      {
                        name: "Tanker trips avoided/yr",
                        value: safeNum(
                          props.environmentalImpact
                            .tankerTripsAvoided_per_year
                        ),
                      },
                      {
                        name: "Per capita water saved (kL/yr)",
                        value:
                          safeNum(
                            props.environmentalImpact
                              .perCapitaWaterSaved_litres_per_year
                          ) / 1000,
                      },
                      {
                        name: "Energy saved (kWh/yr)",
                        value: safeNum(
                          props.environmentalImpact
                            .energySaved_kWh_per_year
                        ),
                      },
                    ].filter((d) => d.value > 0)
                  : []
              }
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={90}
              paddingAngle={3}
              isAnimationActive
              labelLine={false}
              label={(
                entry: {
                  value?: number;
                  payload?: { value?: number; name?: string };
                  name?: string;
                },
              ) => {
                const val = safeNum(entry?.value ?? entry?.payload?.value);
                const formatted =
                  val >= 1000
                    ? Math.round(val).toLocaleString()
                    : val.toFixed(1);
                return `${
                  entry?.name ?? entry?.payload?.name ?? "?"
                }: ${formatted}`;
              }}
            >
              {(props?.environmentalImpact
                ? [
                    {
                      name: "CO₂ saved (kg/yr)",
                      value:
                        props.environmentalImpact.co2Saved_kg_per_year ??
                        0,
                    },
                    {
                      name: "GW recharge (kL/yr)",
                      value:
                        (props.environmentalImpact
                          .groundwaterRecharge_litres_per_year ?? 0) / 1000,
                    },
                    {
                      name: "Tanker trips avoided/yr",
                      value:
                        props.environmentalImpact
                          .tankerTripsAvoided_per_year ?? 0,
                    },
                    {
                      name: "Per capita water saved (kL/yr)",
                      value:
                        (props.environmentalImpact
                          .perCapitaWaterSaved_litres_per_year ?? 0) / 1000,
                    },
                    {
                      name: "Energy saved (kWh/yr)",
                      value:
                        props.environmentalImpact
                          .energySaved_kWh_per_year ?? 0,
                    },
                  ].filter((d) => d.value > 0)
                : []
              ).map((entry, index) => (
                <Cell
                  key={`cell-env-${index}`}
                  fill={
                    [
                      "#38bdf8",
                      "#22c55e",
                      "#f97316",
                      "#a855f7",
                      "#eab308",
                    ][index % 5]
                  }
                  stroke="#020617"
                  strokeWidth={1}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value: number, name: string) => {
                switch (name) {
                  case "CO₂ saved (kg/yr)":
                    return [`${value.toLocaleString()} kg`, name];
                  case "GW recharge (kL/yr)":
                    return [
                      `${value.toLocaleString()} kL`,
                      "GW recharge / year",
                    ];
                  case "Per capita water saved (kL/yr)":
                    return [
                      `${value.toLocaleString()} kL`,
                      "Per capita water saved / year",
                    ];
                  case "Energy saved (kWh/yr)":
                    return [`${value.toLocaleString()} kWh`, name];
                  default:
                    return [value.toLocaleString(), name];
                }
              }}
              contentStyle={{
                backgroundColor: "#b2cfa2ff",
                border: "1px solid #1f2937",
                borderRadius: "0.5rem",
                color: "#e5e7eb",
                fontSize: "0.75rem",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {!props?.environmentalImpact && (
          <p className="mt-3 text-xs text-slate-400">
            Environmental impact data will appear here once the assessment
            report is generated from Firebase.
          </p>
        )}
      </div>

      {/* Environmental Impact Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-900/60 to-slate-900/80 backdrop-blur-lg border border-teal-700 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-teal-300">
          {t("environmentalImpact")}
        </h3>

        {/* Top metrics row */}
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 mb-4">
          <div>
            <div className="text-slate-400 text-xs">CO₂ saved / year</div>
            <div className="font-semibold text-teal-300">
              {props?.environmentalImpact?.co2Saved_kg_per_year != null
                ? `${props.environmentalImpact.co2Saved_kg_per_year.toLocaleString()} kg`
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">
              Groundwater recharge / year
            </div>
            <div className="font-semibold text-teal-300">
              {props?.environmentalImpact
                ?.groundwaterRecharge_litres_per_year != null
                ? `${props.environmentalImpact.groundwaterRecharge_litres_per_year.toLocaleString()} L`
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">
              Tanker trips avoided / year
            </div>
            <div className="font-semibold text-teal-300">
              {props?.environmentalImpact?.tankerTripsAvoided_per_year !=
              null
                ? props.environmentalImpact.tankerTripsAvoided_per_year.toLocaleString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Sustainability rating</div>
            <div className="font-semibold text-teal-300">
              {props?.environmentalImpact?.sustainabilityRating ?? "—"}
            </div>
          </div>
        </div>

        {/* Secondary metrics */}
        <ul className="space-y-2 text-sm text-teal-200 font-semibold mb-4">
          <li>
            🌍 Groundwater dependency reduced by{" "}
            <span className="text-teal-300">
              {props?.environmentalImpact
                ?.groundwaterDependencyReduction_pct != null
                ? `${props.environmentalImpact.groundwaterDependencyReduction_pct}%`
                : "—"}
            </span>
          </li>
          <li>
            💧 Per person water saved / year:{" "}
            <span className="text-teal-300">
              {props?.environmentalImpact
                ?.perCapitaWaterSaved_litres_per_year != null
                ? `${props.environmentalImpact.perCapitaWaterSaved_litres_per_year.toLocaleString()} L`
                : "—"}
            </span>
          </li>
          <li>
            🏠 Equivalent households served:{" "}
            <span className="text-teal-300">
              {props?.environmentalImpact
                ?.householdsEquivalentWaterServed != null
                ? props.environmentalImpact.householdsEquivalentWaterServed.toLocaleString()
                : "—"}
            </span>
          </li>
          <li>
            ⚡ Energy saved / year:{" "}
            <span className="text-teal-300">
              {props?.environmentalImpact?.energySaved_kWh_per_year !=
              null
                ? `${props?.environmentalImpact.energySaved_kWh_per_year.toLocaleString()} kWh`
                : "—"}
            </span>
          </li>
        </ul>

        {/* Description bullets from backend, fallback to static copy */}
        <div className="border-t border-teal-800/60 pt-3 mt-3">
          <p className="text-slate-300 mb-2 text-sm">
            {t("impactDescription")}:
          </p>
          <ul className="space-y-1.5 text-xs text-teal-100">
            {Array.isArray(props?.environmentalImpact?.descriptionBullets) &&
            props.environmentalImpact.descriptionBullets.length > 0 ? (
              props.environmentalImpact.descriptionBullets.map(
                (line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span>•</span>
                    <span>{line}</span>
                  </li>
                )
              )
            ) : (
              <>
                <li>• Reduce dependency on groundwater sources</li>
                <li>• Save potable water through rooftop harvesting</li>
                <li>• Recharge local aquifers and improve resilience</li>
                <li>• Lower energy demand for pumping and treatment</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
