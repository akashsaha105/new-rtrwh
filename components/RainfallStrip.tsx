import React from "react";

interface Props{
    month: string;
    rainfall: number;
    rainCaptured: number;
}

export default function RainfallStrip(props: Props) {
  return (
    <div className="w-full bg-white/10 border border-white/20 p-4 text-white text-sm font-medium">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-teal-300">{props.month} Rainfall</div>
          <div className="text-xl font-semibold">{props.rainfall.toFixed(2)} mm</div>
        </div>

        <div className="h-full w-px bg-white/20 mx-4"></div>

        <div>
          <div className="text-teal-300">Total Captured</div>
          <div className="text-xl font-semibold">
            {props.rainCaptured.toLocaleString()} L
          </div>
        </div>
      </div>
    </div>
  );
}
