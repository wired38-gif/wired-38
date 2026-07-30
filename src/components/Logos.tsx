import React from "react";

// ─── ClearWorth Residential Logo ─────────────────────────────────────────────
// Teal/sage green CW lettermark + wordmark
// Brand color: #6BBF9E (sage green/teal from the logo)

interface LogoProps {
  className?: string;
  variant?: "full" | "mark" | "stacked";
  dark?: boolean; // true = light text on dark bg
}

export function ClearWorthLogo({ className = "", variant = "full", dark = false }: LogoProps) {
  const green = "#6BBF9E";
  const textColor = dark ? "#FFFFFF" : "#2D3748";
  const subColor = dark ? "rgba(255,255,255,0.6)" : "#718096";

  const Mark = () => (
    <svg viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      {/* C stroke */}
      <path
        d="M26 6C17.163 6 10 13.163 10 22s7.163 16 16 16c4.8 0 9.1-2.1 12.1-5.4"
        stroke={green}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* W strokes */}
      <polyline
        points="28,8 33,26 38,14 43,26 47,8"
        stroke={green}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (variant === "mark") {
    return (
      <div className={className}>
        <Mark />
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        <div className="w-12 h-9"><Mark /></div>
        <div className="text-center">
          <div className="text-sm font-black tracking-tight" style={{ color: textColor }}>ClearWorth</div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: subColor }}>Residential</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-10 h-7"><Mark /></div>
      <div>
        <div className="text-base font-black tracking-tight leading-none" style={{ color: textColor }}>ClearWorth</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] leading-none mt-0.5" style={{ color: subColor }}>
          Residential
        </div>
      </div>
    </div>
  );
}

// ─── Entrata Logo ─────────────────────────────────────────────────────────────
// Red "entrata" wordmark — the distinctive Entrata brand font style

interface EntrataLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  white?: boolean;
}

export function EntrataLogo({ className = "", size = "md", white = false }: EntrataLogoProps) {
  const color = white ? "#FFFFFF" : "#E31837"; // Entrata red
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

  return (
    <span
      className={`font-black tracking-tight select-none ${sizes[size]} ${className}`}
      style={{
        color,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        letterSpacing: "-0.03em",
      }}
    >
      entrata
    </span>
  );
}

// ─── OXP Badge ────────────────────────────────────────────────────────────────
export function OXPBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="bg-[#003087] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">OXP</span>
      <span className="text-slate-400 text-[10px] font-medium">Operations Experience Platform</span>
    </div>
  );
}

// ─── RXP Badge ────────────────────────────────────────────────────────────────
export function RXPBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="bg-[#6BBF9E] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">RXP</span>
      <span className="text-slate-400 text-[10px] font-medium">Resident Experience Platform</span>
    </div>
  );
}

// ─── Powered By Footer ────────────────────────────────────────────────────────
export function PoweredByEntrata({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`text-[10px] ${dark ? "text-slate-400" : "text-gray-400"} font-medium`}>Powered by</span>
      <EntrataLogo size="sm" white={dark} />
    </div>
  );
}
