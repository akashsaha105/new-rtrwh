import { JSX } from "react";

export interface AquiferProperty {
  label: string;
  value: string | number;
  category: string; // "General", "Depth", "Hydro", "Yield", etc.
  icon?: JSX.Element;
}
