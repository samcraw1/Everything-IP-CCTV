"use client";

import { Schematic } from "@/types";

interface SchematicCardProps {
  schematic: Schematic;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SchematicCard({ schematic, onEdit, onDelete }: SchematicCardProps) {
  const date = new Date(schematic.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-3 flex items-center gap-3">
      {/* Schematic icon */}
      <div className="w-12 h-12 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[var(--accent)]">
          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{schematic.name}</p>
        <p className="text-[10px] text-[var(--text-tertiary)] mono mt-0.5">{date}</p>
      </div>

      {/* Actions */}
      <button
        onClick={onEdit}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--accent)] bg-[var(--accent-dim)] hover:bg-[var(--accent)]/20 transition-colors mono tracking-wide"
      >
        EDIT
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.55 6a.75.75 0 01-1.493-.137l.55-6a.75.75 0 01.793-.66zm2.84 0a.75.75 0 01.793.66l.55 6a.75.75 0 01-1.493.137l-.55-6a.75.75 0 01.7-.797z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
