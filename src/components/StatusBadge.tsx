"use client";

import { LeadStatus, STATUS_CONFIG } from "@/types";

interface StatusBadgeProps {
  status: LeadStatus;
  size?: "sm" | "md";
}

const STATUS_DOTS: Record<LeadStatus, string> = {
  new: "bg-[var(--accent)]",
  quoted: "bg-[var(--warning)]",
  follow_up: "bg-[#ff6b35]",
  booked: "bg-[var(--success)]",
  closed: "bg-[#5a6577]",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const dotColor = STATUS_DOTS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold mono tracking-wide ${config.bgColor} ${config.color} ${
        size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {config.label}
    </span>
  );
}
