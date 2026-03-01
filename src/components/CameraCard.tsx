"use client";

import { Camera } from "@/types";

interface CameraCardProps {
  camera: Camera;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CameraCard({ camera, onEdit, onDelete }: CameraCardProps) {
  const openUrl = camera.web_url || `http://${camera.ip_address}`;

  return (
    <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-3 flex items-center gap-3">
      {/* Camera icon */}
      <div className="w-12 h-12 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[var(--accent)]">
          <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{camera.name}</p>
          {camera.brand && (
            <span className="text-[10px] mono text-[var(--text-tertiary)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded">
              {camera.brand}
            </span>
          )}
        </div>
        <p className="text-xs mono text-[var(--accent)] mt-0.5">{camera.ip_address}</p>
        {camera.location_note && (
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">{camera.location_note}</p>
        )}
      </div>

      {/* Actions */}
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--success)] bg-[var(--success)]/10 hover:bg-[var(--success)]/20 transition-colors mono tracking-wide"
      >
        OPEN
      </a>
      <button
        onClick={onEdit}
        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
        </svg>
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
