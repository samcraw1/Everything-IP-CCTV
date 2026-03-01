"use client";

import { useState } from "react";

export type Tool = "select" | "pen" | "line" | "rect" | "text" | "camera" | "eraser";
export type CameraType = "dome" | "bullet" | "ptz";
export type PenColor = "#ffffff" | "#ff4d6a" | "#3b82f6" | "#00e68a" | "#ffb020";
export type StrokeWidth = 2 | 4 | 8;

interface SchematicToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  penColor: PenColor;
  onPenColorChange: (color: PenColor) => void;
  strokeWidth: StrokeWidth;
  onStrokeWidthChange: (width: StrokeWidth) => void;
  onCameraSelect: (type: CameraType) => void;
}

const COLORS: PenColor[] = ["#ffffff", "#ff4d6a", "#3b82f6", "#00e68a", "#ffb020"];
const WIDTHS: StrokeWidth[] = [2, 4, 8];

export default function SchematicToolbar({
  activeTool,
  onToolChange,
  penColor,
  onPenColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onCameraSelect,
}: SchematicToolbarProps) {
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);

  const tools: { key: Tool; label: string; icon: React.ReactNode }[] = [
    {
      key: "select",
      label: "Select",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      key: "pen",
      label: "Draw",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
          <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
        </svg>
      ),
    },
    {
      key: "line",
      label: "Line",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
          <line x1="4" y1="20" x2="20" y2="4" />
        </svg>
      ),
    },
    {
      key: "rect",
      label: "Box",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      key: "text",
      label: "Text",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h11.25c1.035 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875H4.875C3.839 11.25 3 10.41 3 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h11.25a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375H4.875zm10.125 9a.75.75 0 000 1.5h3.375a.375.375 0 01.375.375v4.5a.375.375 0 01-.375.375H4.875a.375.375 0 01-.375-.375v-4.5c0-.207.168-.375.375-.375H15a.75.75 0 000-1.5H4.875C3.839 13.5 3 14.34 3 15.375v4.5c0 1.035.84 1.875 1.875 1.875h14.25c1.035 0 1.875-.84 1.875-1.875v-4.5c0-1.036-.84-1.875-1.875-1.875H15z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      key: "camera",
      label: "Camera",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      key: "eraser",
      label: "Erase",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-1)] border-t border-[var(--border)] safe-area-bottom">
      {/* Pen options popover */}
      {showPenOptions && activeTool === "pen" && (
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-4">
          <div className="flex gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onPenColorChange(color)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  penColor === color ? "border-[var(--accent)] scale-110" : "border-[var(--border)]"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="w-px h-6 bg-[var(--border)]" />
          <div className="flex gap-1.5">
            {WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => onStrokeWidthChange(w)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  strokeWidth === w
                    ? "bg-[var(--accent-dim)] border border-[var(--accent)]"
                    : "bg-[var(--surface-2)] border border-[var(--border)]"
                }`}
              >
                <div className="rounded-full bg-current" style={{ width: w + 2, height: w + 2 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera type popover */}
      {showCameraMenu && (
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          {(["dome", "bullet", "ptz"] as CameraType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                onCameraSelect(type);
                setShowCameraMenu(false);
              }}
              className="flex-1 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-center"
            >
              <div className="text-lg mb-0.5">
                {type === "dome" ? "⊙" : type === "bullet" ? "▬" : "◎"}
              </div>
              <span className="text-[10px] mono uppercase tracking-wider text-[var(--text-secondary)]">
                {type}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main toolbar */}
      <div className="flex items-center justify-around px-2 py-2">
        {tools.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => {
              if (key === "camera") {
                setShowCameraMenu(!showCameraMenu);
                setShowPenOptions(false);
                onToolChange(key);
              } else if (key === "pen") {
                setShowPenOptions(!showPenOptions);
                setShowCameraMenu(false);
                onToolChange(key);
              } else {
                setShowCameraMenu(false);
                setShowPenOptions(false);
                onToolChange(key);
              }
            }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-[44px] ${
              activeTool === key
                ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {icon}
            <span className="text-[9px] mono tracking-wider font-bold uppercase">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
