"use client";

import { Lead } from "@/types";
import StatusBadge from "./StatusBadge";

interface LeadCardProps {
  lead: Lead;
  quoteTotal?: number | null;
  onClick: () => void;
  needsFollowUp: boolean;
}

export default function LeadCard({ lead, quoteTotal, onClick, needsFollowUp }: LeadCardProps) {
  const date = new Date(lead.created_at);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <button
      onClick={onClick}
      className={`card w-full text-left transition-colors hover:bg-neutral-800/50 active:bg-neutral-800 ${
        needsFollowUp ? "follow-up-alert" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{lead.customer_name}</h3>
            {needsFollowUp && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium whitespace-nowrap">
                Follow up!
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">{dateStr}</p>
          {lead.customer_address && (
            <p className="text-sm text-neutral-400 mt-1 truncate">{lead.customer_address}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={lead.status} />
          {quoteTotal != null && (
            <span className="text-sm font-semibold text-green-400">
              ${quoteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
