import { AquiferProperty } from "@/types/Aquifer";
import { Droplet, MapPin, Layers, Ruler, Gauge, Factory } from "lucide-react";

export function sqmToSqft(sqm: number): number {
  if (!sqm || sqm < 0) return 0;
  return sqm * 10.7639104167;
}

export function formatAquiferProperties(props: any): AquiferProperty[] {
  return [
    {
      label: "Aquifer Type",
      value: props.aquifer0,
      category: "General",
      icon: <Layers className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "System",
      value: props.system,
      category: "General",
      icon: <Factory className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "State",
      value: props.state,
      category: "Location",
      icon: <MapPin className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Water Table Depth (mbgl)",
      value: props.mbgl,
      category: "Depth",
      icon: <Ruler className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Average Depth (mbgl)",
      value: props.avg_mbgl,
      category: "Depth",
      icon: <Ruler className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Aquifer Thickness (m)",
      value: props.zone_m,
      category: "Depth",
      icon: <Gauge className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Yield (m³/day)",
      value: props.m3_per_day,
      category: "Yield",
      icon: <Droplet className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Specific Yield",
      value: props.yeild__,
      category: "Yield",
      icon: <Droplet className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Permeability (cm/day)",
      value: props.per_cm,
      category: "Hydro",
      icon: <Gauge className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Area (sq. ft.)",
      value: sqmToSqft(Number(props.area_re)).toFixed(2),
      category: "General",
      icon: <Layers className="w-4 h-4 text-teal-300" />,
    },
  ];
}
