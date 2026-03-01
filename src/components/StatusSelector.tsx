"use client";

import { LeadStatus, STATUS_CONFIG } from "@/types";

interface StatusSelectorProps {
  currentStatus: LeadStatus;
  onSelect: (status: LeadStatus) => void;
  onClose: () => void;
}

const STATUSES: LeadStatus[] = ["new", "quoted", "follow_up", "booked", "closed"];

const DOT_COLORS: Record<LeadStatus, string> = {
  new: "bg-[var(--accent)]",
  quoted: "bg-[var(--warning)]",
  follow_up: "bg-[#ff6b35]",
  booked: "bg-[var(--success)]",
  closed: "bg-[#5a6577]",
};

export default function StatusSelector({ currentStatus, onSelect, onClose }: StatusSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface-1)] rounded-2xl w-full max-w-sm border border-[var(--border)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mono tracking-wider uppercase">Update Status</h3>
        </div>
        <div className="p-2">
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = status === currentStatus;
            return (
              <button
                key={status}
                onClick={() => onSelect(status)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                  isActive ? "bg-[var(--surface-3)]" : "hover:bg-[var(--surface-2)]"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[status]} ${isActive ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--surface-1)]" : ""}`} />
                <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                {isActive && <span className="ml-auto text-[var(--text-tertiary)] text-xs mono">Current</span>}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-[var(--border)]">
          <button onClick={onClose} className="btn btn-secondary w-full">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
