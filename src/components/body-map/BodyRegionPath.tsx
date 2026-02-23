"use client";

import type { RegionConfig } from "./regions";
import type { RegionColour } from "./colours";

interface BodyRegionPathProps {
  region: RegionConfig;
  colour: RegionColour;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function BodyRegionPath({
  region,
  colour,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: BodyRegionPathProps) {
  const strokeWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
  const strokeColour = isSelected ? "#1d4ed8" : isHovered ? "#3b82f6" : colour.stroke;
  const opacity = isHovered ? 0.85 : 0.7;

  return (
    <path
      d={region.path}
      fill={colour.fill}
      fillOpacity={opacity}
      stroke={strokeColour}
      strokeWidth={strokeWidth}
      className="cursor-pointer transition-all duration-150"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <title>{region.label}</title>
    </path>
  );
}
