import { AquiferProperty } from "@/types/Aquifer";
import {
  Droplet,
  MapPin,
  Layers,
  Ruler,
  Factory,
} from "lucide-react";

// Convert string to number safely
function toNumber(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function formatGroundWaterProperties(props: any): AquiferProperty[] {
  return [
    {
      label: "State",
      value: props.State_Name_With_LGD_Code?.split("_")[0] || "NA",
      category: "state",
      icon: <MapPin className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "District",
      value: props.District_Name_With_LGD_Code?.split("_")[0] || "NA",
      category: "district",
      icon: <MapPin className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Block",
      value: props.Block_Name_With_LGD_Code?.split("_")[0] || "NA",
      category: "block",
      icon: <MapPin className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Village",
      value: props.Village || "NA",
      category: "village",
      icon: <MapPin className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Site Name",
      value: props.Site_Name || "NA",
      category: "site",
      icon: <Factory className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Source",
      value: props.SOURCE || "NA",
      category: "source",
      icon: <Layers className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Aquifer Type",
      value: props.Aquifer || "NA",
      category: "aquifer",
      icon: <Layers className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Well Type",
      value: String(props["TYPE"]),
      category: "wellType",
      icon: <Ruler className="w-4 h-4 text-teal-300" />,
    },    
    {
      label: "Well Depth",
      value: toNumber(props["Well_Depth (meters)"]),
      category: "well",
      icon: <Ruler className="w-4 h-4 text-teal-300" />,
    },    
    {
      label: "Pre Monsoon 2022",
      value: toNumber(props["Pre-monsoon_2022 (meters below ground level)"]),
      category: "PreMonsoon2022",
      icon: <Ruler className="w-4 h-4 text-teal-300" />,
    },
    {
      label: "Post Monsoon 2022",
      value: toNumber(props["Post-monsoon_2022 (meters below ground level)"]),
      category: "PostMonsoon2022",
      icon: <Ruler className="w-4 h-4 text-teal-300" />,
    },

    // ⭐ Dynamic multi-year depths
    ...Object.entries(props)
      .filter(([key]) => key.includes("monsoon_")) // picks all the year-wise values
      .map(([key, value]) => ({
        label: key.replace(" (meters below ground level)", ""),
        value: value,
        category: "Water Level",
        icon: <Droplet className="w-4 h-4 text-teal-300" />,
      })),
  ];
}
