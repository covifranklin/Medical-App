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
  // Warm sage/teal tones for selection instead of cold blue
  const strokeWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
  const strokeColour = isSelected ? "#4A7050" : isHovered ? "#5E8A5E" : colour.stroke;
  const opacity = isHovered ? 0.9 : 0.75;

  return (
    <path
      d={region.path}
      fill={colour.fill}
      fillOpacity={opacity}
      stroke={strokeColour}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="cursor-pointer transition-all duration-200"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <title>{region.label}</title>
    </path>
  );
}
