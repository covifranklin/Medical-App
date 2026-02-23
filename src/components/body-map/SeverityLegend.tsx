"use client";

import { LEGEND_ITEMS } from "./colours";

export default function SeverityLegend() {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full border"
            style={{ backgroundColor: item.fill, borderColor: item.stroke }}
          />
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
