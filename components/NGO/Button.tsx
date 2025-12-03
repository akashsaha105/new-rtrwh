import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Size = "sm" | "md" | "lg";

interface NGOCircleButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: Size;
  ariaLabel?: string;
  title?: string;
  className?: string;
}

export default function NGOCircleButton({
  href,
  onClick,
  size = "md",
  ariaLabel,
  title,
  className = "",
}: NGOCircleButtonProps) {
  const sizes: Record<Size, string> = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };

  const fontSizesNGO: Record<Size, number> = {
    sm: 8,
    md: 11,
    lg: 13.5,
  };

  const fontSizesPartner: Record<Size, number> = {
    sm: 4,
    md: 5,
    lg: 6,
  };

  const ring = "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#054a91]";

  const content = (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className={`flex items-center justify-center rounded-full shadow-md ${sizes[size]} ${ring} ${className}`}
      aria-label={ariaLabel ?? title ?? "NGO portal"}
      title={title ?? "NGO Portal"}
    >
      <svg
        viewBox="0 0 48 48"
        width="100%"
        height="100%"
        className="rounded-full"
        role="img"
        aria-labelledby="ngoTitle"
      >
        <title id="ngoTitle">NGO Portal</title>

        {/* Top saffron */}
        <rect x="0" y="0" width="48" height="16" fill="#FF9933" />

        {/* Middle white */}
        <rect x="0" y="16" width="48" height="16" fill="#FFFFFF" />

        {/* Bottom green */}
        <rect x="0" y="32" width="48" height="16" fill="#138808" />

        {/* ---- MAIN NGO TEXT (BIG + DESIGNED) ---- */}
        <defs>
          <linearGradient id="ngoTextGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#054a91" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <text
          x="24"
          y="27"
          textAnchor="middle"
          fill="url(#ngoTextGrad)"
          fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial"
          fontWeight="900"
          fontSize={fontSizesNGO[size]}
          style={{
            letterSpacing: 1,
            paintOrder: "stroke",
            stroke: "#ffffff",
            strokeWidth: 0.6,
            filter: "drop-shadow(0px 0.6px 1px rgba(0,0,0,0.4))",
          }}
        >
          NGO
        </text>

        {/* Secondary text "Partner" */}
        <text
          x="24"
          y="39"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial"
          fontWeight="600"
          fontSize={fontSizesPartner[size]}
          style={{ opacity: 0.9, letterSpacing: 0.5 }}
        >
          Partner
        </text>

        {/* Gloss overlay */}
        <defs>
          <linearGradient id="gloss" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#gloss)" />
      </svg>
    </motion.button>
  );

  if (href) {
    return (
      <Link href={href} passHref legacyBehavior>
        <a
          aria-label={ariaLabel ?? title ?? "NGO portal"}
          onClick={(e) => {
            if (onClick) onClick(e as any);
          }}
          className="inline-block"
        >
          {content}
        </a>
      </Link>
    );
  }

  return content;
}
