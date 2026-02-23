"use client";

/**
 * Non-interactive SVG body silhouette outlines for front and back views.
 * These provide the body shape context behind the clickable regions.
 */

export function FrontOutline() {
  return (
    <g className="pointer-events-none" fill="none" stroke="#d1d5db" strokeWidth="1.5">
      {/* Head outline */}
      <ellipse cx="100" cy="26" rx="18" ry="24" />
      {/* Neck */}
      <line x1="92" y1="50" x2="90" y2="68" />
      <line x1="108" y1="50" x2="110" y2="68" />
      {/* Torso */}
      <path d="M72,88 L70,180 L84,180 L100,185 L116,180 L130,180 L128,88" />
      {/* Left arm */}
      <path d="M62,78 L48,120 L40,150 L36,160 L34,176 L36,200 L32,210" />
      {/* Right arm */}
      <path d="M138,78 L152,120 L160,150 L164,160 L166,176 L164,200 L168,210" />
      {/* Left leg */}
      <path d="M84,180 L86,220 L88,260 L86,295 L84,330 L84,390 L84,410 L80,438" />
      <path d="M100,210 L96,250 L94,290 L96,330 L94,390 L94,410 L92,440" />
      {/* Right leg */}
      <path d="M116,180 L114,220 L112,260 L114,295 L116,330 L116,390 L116,410 L120,438" />
      <path d="M100,210 L104,250 L106,290 L104,330 L106,390 L106,410 L108,440" />
    </g>
  );
}

export function BackOutline() {
  return (
    <g className="pointer-events-none" fill="none" stroke="#d1d5db" strokeWidth="1.5">
      {/* Head outline */}
      <ellipse cx="100" cy="26" rx="18" ry="24" />
      {/* Neck */}
      <line x1="92" y1="50" x2="90" y2="68" />
      <line x1="108" y1="50" x2="110" y2="68" />
      {/* Torso / back */}
      <path d="M72,88 L70,180 L84,180 L100,185 L116,180 L130,180 L128,88" />
      {/* Shoulders */}
      <path d="M72,88 L62,78" />
      <path d="M128,88 L138,78" />
      {/* Arms (simplified from back) */}
      <path d="M62,78 L48,120 L40,150 L36,160 L34,176 L36,200 L32,210" />
      <path d="M138,78 L152,120 L160,150 L164,160 L166,176 L164,200 L168,210" />
      {/* Legs */}
      <path d="M84,180 L86,220 L88,260 L86,295 L84,330 L84,390 L84,410 L80,438" />
      <path d="M100,210 L96,250 L94,290 L96,330 L94,390 L94,410 L92,440" />
      <path d="M116,180 L114,220 L112,260 L114,295 L116,330 L116,390 L116,410 L120,438" />
      <path d="M100,210 L104,250 L106,290 L104,330 L106,390 L106,410 L108,440" />
      {/* Spine */}
      <line x1="100" y1="68" x2="100" y2="185" strokeDasharray="3,3" stroke="#d1d5db" />
    </g>
  );
}
