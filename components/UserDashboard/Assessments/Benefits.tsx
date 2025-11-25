import { useTranslations } from "next-intl";
import React from "react";

const schemes = [
  {
    title: "Jal Shakti Abhiyan: Catch the Rain",
    type: "Central Govt Initiative",
    description:
      "A nationwide campaign to encourage water conservation and rainwater harvesting. While primarily an awareness and technical support mission, it facilitates local bodies to fund RWH structures.",
    benefits: [
      "Technical guidance for RWH structures.",
      "Funding support via local municipal bodies (MGNREGA for rural).",
      "Focus on renovating traditional water bodies.",
    ],
    process: [
      "Contact your local Jal Shakti Kendra.",
      "Submit a proposal for RWH implementation.",
      "Verification by local technical officers.",
    ],
    link: "https://jsactr.mowr.gov.in/",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Delhi Jal Board RWH Scheme",
    type: "State Subsidy (Delhi)",
    description:
      "Financial assistance for installing rooftop rainwater harvesting systems in Delhi to combat groundwater depletion.",
    benefits: [
      "Subsidy up to ₹50,000 or 50% of cost (whichever is less).",
      "10% rebate on water bills for functional systems.",
      "Additional 5% rebate for waste water recycling.",
    ],
    process: [
      "Install RWH system as per DJB guidelines.",
      "Apply online via DJB portal with photos and completion certificate.",
      "Site inspection by DJB officials.",
      "Subsidy disbursement and bill rebate activation.",
    ],
    link: "http://djb.gov.in/DJBPortal/portals/RainWaterHarvesting.shtml",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "CHHATA Scheme (Odisha)",
    type: "State Subsidy (Odisha)",
    description:
      "Community Harnessing and Harvesting Rainwater Artificially from Terrace to Aquifer (CHHATA) scheme for urban local bodies.",
    benefits: [
      "Subsidy of 50% of the cost, up to ₹55,000.",
      "Targets private and government buildings.",
      "Focus on recharging groundwater aquifers.",
    ],
    process: [
      "Submit application on the official portal.",
      "Technical feasibility check by urban local body.",
      "Construction of the system.",
      "Final verification and subsidy release.",
    ],
    link: "https://waterresources.odisha.gov.in/",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Atal Bhujal Yojana",
    type: "Central Govt Scheme",
    description:
      "A scheme for sustainable groundwater management with community participation in water-stressed areas of 7 states.",
    benefits: [
      "Community-led water security plans.",
      "Incentives for adopting water-efficient practices.",
      "Support for convergence with other schemes like MGNREGA.",
    ],
    process: [
      "Form a Water User Association (WUA) or Gram Panchayat committee.",
      "Prepare a Water Security Plan.",
      "Get approval and funding for interventions like RWH.",
    ],
    link: "https://ataljal.mowr.gov.in/",
    color: "from-indigo-500 to-violet-500",
  },
];

export default function Benefits() {
  return (
    <div className="relative p-6 mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
      <div className="mb-8">
        <h4 className="text-2xl font-bold text-slate-100 mb-2">
          Government Schemes & Subsidies
        </h4>
        <p className="text-slate-400">
          Explore financial aid and benefits provided by the government for
          installing Rainwater Harvesting systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {schemes.map((scheme, idx) => (
          <div
            key={idx}
            className="group relative flex flex-col rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-slate-600 hover:bg-slate-800/60"
          >
            <div className="mb-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r ${scheme.color} shadow-sm mb-2`}
              >
                {scheme.type}
              </span>
              <h5 className="text-xl font-bold text-slate-100">
                {scheme.title}
              </h5>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {scheme.description}
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h6 className="text-sm font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                  Key Benefits
                </h6>
                <ul className="space-y-1">
                  {scheme.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h6 className="text-sm font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                  Application Process
                </h6>
                <ol className="space-y-1 ml-1">
                  {scheme.process.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <a
                href={scheme.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 hover:text-white group-hover:bg-blue-600 group-hover:text-white"
              >
                Visit Official Website
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex gap-3">
          <svg className="h-6 w-6 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h6 className="font-semibold text-amber-200">Note on Eligibility</h6>
            <p className="text-sm text-amber-200/80 mt-1">
              Schemes and subsidies vary significantly by state and municipality. Always verify the latest guidelines on the official portal of your local municipal corporation or water board.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
