// import React, { useEffect, useState } from "react";
import { Droplets, Gauge, Layers } from "lucide-react";

interface SystemProps {
  tankType?: string;
  tankDimension?: string;
  tankCapacity?: number | string;
  tankUtilization?: number | string;
  tankDemandCoverage?: number | string;
  tankOverflow?: boolean | string;
  tankOverflowLoss?: string | string;
  tankEfficiency?: number | string;

  rechargeType?: string;
  rechargeDimension?: string;
  rechargeCapacity?: number | string;
  rechargeInfiltrationRate?: string;
  rechargeEfficiency?: number | string;
  rechargeOverflow?: boolean | string;
  rechargeOverflowRisk?: number | string;
  rechargeSiltLevel?: number | string;
}

// function computeOverflow(
//   tankCapacity: number,
//   tankUsed: number,
//   pitCapacity: number,
//   pitUsed: number,
//   incomingWater: number
// ) {
//   const tankSpace = tankCapacity - tankUsed;
//   const pitSpace = pitCapacity - pitUsed;

//   let toTank = 0;
//   let toPit = 0;
//   let overflow = 0;

//   // Case 1: No Overflow
//   if (tankSpace > 0 && pitSpace > 0) {
//     if (incomingWater <= tankSpace) {
//       toTank = incomingWater;
//     } else {
//       toTank = tankSpace;
//       const remaining = incomingWater - tankSpace;

//       if (remaining <= pitSpace) toPit = remaining;
//       else {
//         toPit = pitSpace;
//         overflow = remaining - pitSpace;
//       }
//     }

//     return {
//       message: "No Overflow",
//       toTank,
//       toPit,
//       overflow,
//       status: "safe",
//     };
//   }

//   // Case 2: Tank full, Pit has space
//   if (tankSpace <= 0 && pitSpace > 0) {
//     if (incomingWater <= pitSpace) toPit = incomingWater;
//     else {
//       toPit = pitSpace;
//       overflow = incomingWater - pitSpace;
//     }

//     return {
//       message: `${toPit} L directed to Recharge Pit`,
//       toTank,
//       toPit,
//       overflow,
//       status: overflow > 0 ? "overflow" : "redirect",
//     };
//   }

//   // Case 3: Pit full, Tank has space
//   if (pitSpace <= 0 && tankSpace > 0) {
//     if (incomingWater <= tankSpace) toTank = incomingWater;
//     else {
//       toTank = tankSpace;
//       overflow = incomingWater - tankSpace;
//     }

//     return {
//       message: `${toTank} L directed to Storage Tank`,
//       toTank,
//       toPit,
//       overflow,
//       status: overflow > 0 ? "overflow" : "redirect",
//     };
//   }

//   // Case 4: Both full → Pure overflow
//   overflow = incomingWater;

//   return {
//     message: `Overflow: ${overflow} L wasted`,
//     toTank,
//     toPit,
//     overflow,
//     status: "overflow",
//   };
// }

function computeOverflow(
  tankOverflow: boolean,
  pitOverflow: boolean,
  incoming: number
) {
  // let toTank = 0;
  // let toPit = 0;
  let overflow = 0;
  let message = "";
  let status = "";

  // Case A: No Overflow Anywhere
  if (!tankOverflow && !pitOverflow) {
    message = "No Overflow";
    status = "safe";
    return { message, overflow: 0, status };
  }

  // Case B: Tank is Overflowing → redirect to Pit
  if (tankOverflow && !pitOverflow) {
    // toPit = incoming;
    message = `${incoming} L directed to Recharge Pit`;
    status = "redirect";
    return { message, overflow: 0, status };
  }

  // Case C: Pit is Overflowing → redirect to Tank
  if (!tankOverflow && pitOverflow) {
    // toTank = incoming;
    message = `${incoming} L directed to Storage Tank`;
    status = "redirect";
    return { message, overflow: 0, status };
  }

  // Case D: Both Overflowing → Water wasted
  if (tankOverflow && pitOverflow) {
    overflow = incoming;
    message = `Overflow: ${incoming} L wasted`;
    status = "overflow";
    return { message, overflow, status };
  }

  return { message: "Unknown State", overflow: 0, status: "error" };
}

export default function System(props: SystemProps) {
  const tank = {
    type: props.tankType ?? "Storage Tank",
    capacity: props.tankCapacity?.toLocaleString() ?? "---",
    utilization: props.tankUtilization ?? 0,
    demandCoverage: props.tankDemandCoverage ?? 45,
    overflowLoss: props.tankOverflowLoss ?? "0",
    efficiency: props.tankEfficiency ?? 78,
  };

  const pit = {
    type: props.rechargeType ?? "Recharge Pit",
    capacity: props.rechargeCapacity?.toLocaleString() ?? "---",
    infiltrationRate: props.rechargeInfiltrationRate ?? "25 mm/hr",
    rechargeEfficiency: props.rechargeEfficiency ?? 68,
    overflowRisk: props.rechargeOverflowRisk ?? 0,
    siltLevel: props.rechargeSiltLevel ?? 22,
  };

  // const result = computeOverflow(
  //   props.tankCapacity ?? 0,
  //   props.tankUtilization ?? 0,
  //   props.rechargeCapacity ?? 0,
  //   props.rechargeEfficiency ?? 0,
  //   Number(props.tankOverflowLoss) ?? 0 // or incoming rainfall
  // );
  const result = computeOverflow(
    Boolean(props.tankOverflow) ?? false,
    Boolean(props.rechargeOverflow) ?? false,
    Number(props.tankOverflowLoss) || 0
  );

  // const [tankOverflow, setTankOverflow] = useState<boolean>(false);
  // const [rechargeOverflow, setRechargeOverflow] = useState<boolean>(false);

  // useEffect(() => {
  //   if (tankOverflow && !rechargeOverflow) {
  //     console.log("Storage Tank is Overflowing");
  //   }
  // })
  return (
    <div className="mt-16 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RECHARGE PIT */}
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 text-xs bg-green-500/20 border border-green-400/30 rounded-full text-green-300">
              RECHARGE SYSTEM
            </span>
            <h4 className="text-2xl font-semibold text-green-300">
              🌧️ Recharge Pits
            </h4>
          </div>

          <div className="relative flex flex-col h-full bg-gradient-to-b from-green-900/40 to-green-900/10 backdrop-blur-xl border border-green-400/30 p-6 rounded-2xl shadow-xl">
            <h5 className="text-xl font-bold text-green-300 mb-4 mt-2 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-green-400" /> {pit.type}
            </h5>

            <div className="space-y-2 text-sm text-white/80 mb-5">
              <Metric label="Capacity" value={`${pit.capacity} L`} />
              <Metric
                label="Infiltration Rate"
                value={`${pit.infiltrationRate} mm/hr`}
              />
              <Metric
                label="Recharge Efficiency"
                value={`${pit.rechargeEfficiency}%`}
              />
              <Metric label="Overflow Risk" value={`${pit.overflowRisk}%`} />
              {/* <Metric label="Silt Level" value={`${pit.siltLevel}%`} /> */}
            </div>

            {/* OVERFLOW ALERT */}
            {/* <OverflowMessage
              amount={pit.overflowRisk > 100 ? pit.overflowRisk : 0}
            /> */}
            <OverflowMessage result={result} />

            <div className="mt-auto">
              <ProgressBar
                title="Recharge Efficiency"
                percent={Number(pit.rechargeEfficiency)}
                color="from-green-400 to-green-500"
              />
            </div>
          </div>
        </div>

        
        {/* STORAGE TANK */}
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300">
              STORAGE SYSTEM
            </span>
            <h4 className="text-2xl font-semibold text-blue-300">
              🛢️ Storage Tanks
            </h4>
          </div>

          <div className="relative flex flex-col h-full bg-gradient-to-b from-blue-900/40 to-blue-900/10 backdrop-blur-xl border border-blue-400/30 p-6 rounded-2xl shadow-xl">
            <h5 className="text-xl font-bold text-blue-300 mb-4 mt-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" /> {tank.type}
            </h5>

            <div className="space-y-2 text-sm text-white/80 mb-6">
              <Metric label="Capacity" value={`${tank.capacity} L`} />
              {/* <Metric
                label="Demand Coverage"
                value={`${tank.demandCoverage}%`}
              /> */}
              <Metric
                label="Remaining Capacity"
                value={`${tank.demandCoverage} L`}
              />
              <Metric
                label="Storage Efficiency"
                value={`${tank.efficiency}%`}
              />
              <Metric label="Overflow Loss" value={`${tank.overflowLoss} L`} />
            </div>

            {/* OVERFLOW ALERT AT TOP */}
            {/* <OverflowMessage amount={Number(tank.overflowLoss)} /> */}
            <OverflowMessage result={result} />

            <ProgressBar
              title="Utilization"
              percent={
                typeof tank.utilization === "number" ? tank.utilization : 0
              }
              color="from-blue-400 to-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between text-white/70">
      <span className="font-medium">{label}:</span>
      <span className="text-white">{value}</span>
    </li>
  );
}

function ProgressBar({
  title,
  percent,
  color,
}: {
  title: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm text-white/70 mb-1 flex items-center gap-2">
        <Gauge className="w-4 h-4" /> {title}
      </p>
      <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className={`h-3 rounded-full bg-gradient-to-r ${color} shadow-inner shadow-white/30`}
        ></div>
      </div>
      <p className="text-xs mt-1 text-yellow-300">{percent}%</p>
    </div>
  );
}

function OverflowMessage({
  result,
}: {
  result: {
    message: string;
    overflow: number;
    status: string;
  };
}) {
  const isOverflow = result.status === "overflow";

  return (
    <div
      className={`mb-6 p-4 rounded-xl border backdrop-blur-xl shadow-lg ${
        isOverflow
          ? "border-red-400/40 bg-red-900/30 text-red-200"
          : "border-green-400/40 bg-green-900/30 text-green-200"
      }`}
    >
      <p className="font-semibold text-lg flex items-center gap-2">
        {isOverflow ? "⚠️ Overflow" : "✓ Safe"}
      </p>

      <p className="text-sm opacity-80 mt-1">{result.message}</p>
    </div>
  );
}
