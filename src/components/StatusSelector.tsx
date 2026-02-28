"use client";

import { LeadStatus, STATUS_CONFIG } from "@/types";

interface StatusSelectorProps {
  currentStatus: LeadStatus;
  onSelect: (status: LeadStatus) => void;
  onClose: () => void;
}

const STATUSES: LeadStatus[] = ["new", "quoted", "follow_up", "booked", "closed"];

export default function StatusSelector({ currentStatus, onSelect, onClose }: StatusSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl w-full max-w-sm border border-neutral-800" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-neutral-800">
          <h3 className="text-lg font-semibold text-white">Update Status</h3>
        </div>
        <div className="p-2">
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = status === currentStatus;
            return (
              <button
                key={status}
                onClick={() => onSelect(status)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                  isActive ? "bg-neutral-800" : "hover:bg-neutral-800/50"
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${config.bgColor} ${isActive ? "ring-2 ring-white" : ""}`} />
                <span className={`text-base font-medium ${config.color}`}>{config.label}</span>
                {isActive && <span className="ml-auto text-neutral-500 text-sm">Current</span>}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-neutral-800">
          <button onClick={onClose} className="btn btn-secondary w-full">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
