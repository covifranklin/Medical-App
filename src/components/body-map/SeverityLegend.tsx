"use client";

import { LEGEND_ITEMS } from "./colours";

export default function SeverityLegend() {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.fill, border: `1.5px solid ${item.stroke}` }}
          />
          <span className="text-xs font-medium text-warm-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
