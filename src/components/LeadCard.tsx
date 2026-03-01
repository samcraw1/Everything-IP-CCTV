"use client";

import { Lead, LeadStatus } from "@/types";
import StatusBadge from "./StatusBadge";

interface LeadCardProps {
  lead: Lead;
  quoteTotal?: number | null;
  onClick: () => void;
  needsFollowUp: boolean;
}

const ACCENT_COLORS: Record<LeadStatus, string> = {
  new: "bg-[var(--accent)]",
  quoted: "bg-[var(--warning)]",
  follow_up: "bg-[#ff6b35]",
  booked: "bg-[var(--success)]",
  closed: "bg-[#5a6577]",
};

export default function LeadCard({ lead, quoteTotal, onClick, needsFollowUp }: LeadCardProps) {
  const date = new Date(lead.created_at);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <button
      onClick={onClick}
      className={`card w-full text-left transition-all duration-150 hover:border-[var(--border-hover)] active:scale-[0.98] overflow-hidden ${
        needsFollowUp ? "follow-up-alert" : ""
      }`}
      style={{ padding: 0 }}
    >
      <div className="flex">
        {/* Status accent bar */}
        <div className={`w-1 shrink-0 ${ACCENT_COLORS[lead.status]} ${needsFollowUp ? "glow-pulse" : ""}`} />

        <div className="flex-1 p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-[var(--text-primary)] truncate text-[15px]">
                {lead.customer_name}
              </h3>
              {needsFollowUp && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--danger-dim)] text-[var(--danger)] text-[10px] font-bold mono tracking-wider whitespace-nowrap">
                  FOLLOW UP
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <span className="text-xs mono">{dateStr}</span>
              {lead.customer_address && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-[var(--text-tertiary)]" />
                  <span className="text-xs truncate">{lead.customer_address}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={lead.status} />
            {quoteTotal != null && (
              <span className="text-sm font-bold text-[var(--success)] mono">
                ${quoteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
