"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Stage, Layer, Line, Rect, Text, Group, Circle, RegularPolygon, Image as KonvaImage } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import SchematicToolbar, { Tool, CameraType, PenColor, StrokeWidth } from "@/components/SchematicToolbar";
import { Lead, Schematic } from "@/types";

interface ShapeData {
  id: string;
  type: "pen" | "line" | "rect" | "text" | "camera";
  // Pen
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  // Line
  linePoints?: number[];
  // Rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Text
  text?: string;
  fontSize?: number;
  // Camera
  cameraType?: CameraType;
  rotation?: number;
  fill?: string;
}

let idCounter = 0;
function genId() {
  return `shape_${Date.now()}_${idCounter++}`;
}

export default function SchematicEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = params.id as string;
  const photoIndex = searchParams.get("photo");

  const stageRef = useRef<Konva.Stage>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [schematic, setSchematic] = useState<Schematic | null>(null);
  const [schematicName, setSchematicName] = useState("Site Schematic");
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [undoStack, setUndoStack] = useState<ShapeData[][]>([]);
  const [redoStack, setRedoStack] = useState<ShapeData[][]>([]);

  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [penColor, setPenColor] = useState<PenColor>("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(4);
  const [pendingCameraType, setPendingCameraType] = useState<CameraType>("dome");

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [tempRect, setTempRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [textValue, setTextValue] = useState("");

  const dirtyRef = useRef(false);
  const schematicRef = useRef<Schematic | null>(null);

  // Calculate stage size
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 56 - 80, // top bar + bottom toolbar
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Fetch lead and schematic data
  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, schematicsRes] = await Promise.all([
          fetch(`/api/leads?status=all`),
          fetch(`/api/schematics?lead_id=${leadId}`),
        ]);

        const leadsData = await leadsRes.json();
        const schematicsData = await schematicsRes.json();

        if (Array.isArray(leadsData)) {
          const found = leadsData.find((l: Lead) => l.id === leadId);
          setLead(found || null);

          // Load background photo if requested
          if (photoIndex !== null && found?.photo_urls?.length) {
            const idx = parseInt(photoIndex) || 0;
            const url = found.photo_urls[idx];
            if (url) {
              const img = new window.Image();
              img.crossOrigin = "anonymous";
              img.onload = () => setBgImage(img);
              img.src = url;
            }
          }
        }

        // Load existing schematic if any
        if (Array.isArray(schematicsData) && schematicsData.length > 0) {
          const existing = schematicsData[0];
          setSchematic(existing);
          schematicRef.current = existing;
          setSchematicName(existing.name);
          if (existing.canvas_data && Array.isArray((existing.canvas_data as { shapes?: ShapeData[] }).shapes)) {
            setShapes((existing.canvas_data as { shapes: ShapeData[] }).shapes);
          }
        }
      } catch (err) {
        console.error("Failed to load schematic data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leadId, photoIndex]);

  // Auto-save every 5 seconds when dirty
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      setSaveStatus("saving");
      setSaving(true);

      try {
        const canvasData = { shapes, bgPhotoIndex: photoIndex };

        if (schematicRef.current) {
          await fetch("/api/schematics", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: schematicRef.current.id,
              canvas_data: canvasData,
              name: schematicName,
            }),
          });
        } else {
          const res = await fetch("/api/schematics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lead_id: leadId,
              name: schematicName,
              canvas_data: canvasData,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            setSchematic(created);
            schematicRef.current = created;
          }
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      } finally {
        setSaving(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [shapes, schematicName, leadId, photoIndex]);

  const pushUndo = useCallback((prevShapes: ShapeData[]) => {
    setUndoStack((prev) => [...prev.slice(-29), prevShapes]);
    setRedoStack([]);
  }, []);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus("unsaved");
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, shapes]);
    setShapes(prev);
    setUndoStack((u) => u.slice(0, -1));
    markDirty();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, shapes]);
    setShapes(next);
    setRedoStack((r) => r.slice(0, -1));
    markDirty();
  };

  // Get pointer position relative to stage (accounting for zoom/pan)
  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = getPointerPos();

    if (activeTool === "select") {
      // If clicking on empty space, deselect
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
      return;
    }

    if (activeTool === "eraser") {
      // Find and delete shape under pointer
      const target = e.target;
      if (target !== target.getStage()) {
        const shapeId = target.id() || target.parent?.id();
        if (shapeId) {
          pushUndo(shapes);
          setShapes((prev) => prev.filter((s) => s.id !== shapeId));
          markDirty();
        }
      }
      return;
    }

    if (activeTool === "pen") {
      setIsDrawing(true);
      setCurrentLine([pos.x, pos.y]);
      return;
    }

    if (activeTool === "line") {
      if (!lineStart) {
        setLineStart(pos);
      } else {
        pushUndo(shapes);
        setShapes((prev) => [
          ...prev,
          {
            id: genId(),
            type: "line",
            linePoints: [lineStart.x, lineStart.y, pos.x, pos.y],
            stroke: penColor,
            strokeWidth,
          },
        ]);
        setLineStart(null);
        markDirty();
      }
      return;
    }

    if (activeTool === "rect") {
      setRectStart(pos);
      setTempRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    if (activeTool === "text") {
      setTextInput({ x: pos.x, y: pos.y, visible: true });
      setTextValue("");
      return;
    }

    if (activeTool === "camera") {
      pushUndo(shapes);
      setShapes((prev) => [
        ...prev,
        {
          id: genId(),
          type: "camera",
          x: pos.x,
          y: pos.y,
          cameraType: pendingCameraType,
          rotation: 0,
          fill: penColor,
        },
      ]);
      markDirty();
      return;
    }
  };

  const handleStageMouseMove = () => {
    if (activeTool === "pen" && isDrawing) {
      const pos = getPointerPos();
      setCurrentLine((prev) => [...prev, pos.x, pos.y]);
      return;
    }

    if (activeTool === "rect" && rectStart) {
      const pos = getPointerPos();
      setTempRect({
        x: Math.min(rectStart.x, pos.x),
        y: Math.min(rectStart.y, pos.y),
        w: Math.abs(pos.x - rectStart.x),
        h: Math.abs(pos.y - rectStart.y),
      });
    }
  };

  const handleStageMouseUp = () => {
    if (activeTool === "pen" && isDrawing) {
      setIsDrawing(false);
      if (currentLine.length >= 4) {
        pushUndo(shapes);
        setShapes((prev) => [
          ...prev,
          {
            id: genId(),
            type: "pen",
            points: currentLine,
            stroke: penColor,
            strokeWidth,
          },
        ]);
        markDirty();
      }
      setCurrentLine([]);
      return;
    }

    if (activeTool === "rect" && rectStart && tempRect) {
      if (tempRect.w > 5 && tempRect.h > 5) {
        pushUndo(shapes);
        setShapes((prev) => [
          ...prev,
          {
            id: genId(),
            type: "rect",
            x: tempRect.x,
            y: tempRect.y,
            width: tempRect.w,
            height: tempRect.h,
            stroke: penColor,
            strokeWidth,
          },
        ]);
        markDirty();
      }
      setRectStart(null);
      setTempRect(null);
    }
  };

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      pushUndo(shapes);
      setShapes((prev) => [
        ...prev,
        {
          id: genId(),
          type: "text",
          x: textInput.x,
          y: textInput.y,
          text: textValue.trim(),
          fontSize: 16,
          fill: penColor,
        },
      ]);
      markDirty();
    }
    setTextInput({ ...textInput, visible: false });
    setTextValue("");
  };

  // Wheel zoom
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.08;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Touch pinch zoom
  const lastDist = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 2) {
      e.evt.preventDefault();
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cx = (touches[0].clientX + touches[1].clientX) / 2;
      const cy = (touches[0].clientY + touches[1].clientY) / 2;

      if (lastDist.current === 0) {
        lastDist.current = dist;
        lastCenter.current = { x: cx, y: cy };
        return;
      }

      const scale = stageScale * (dist / lastDist.current);
      const clampedScale = Math.max(0.1, Math.min(5, scale));

      const dcx = cx - lastCenter.current.x;
      const dcy = cy - lastCenter.current.y;

      setStageScale(clampedScale);
      setStagePos((prev) => ({
        x: prev.x + dcx,
        y: prev.y + dcy,
      }));

      lastDist.current = dist;
      lastCenter.current = { x: cx, y: cy };
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
  };

  // Shape drag handler
  const handleDragEnd = (id: string, e: KonvaEventObject<DragEvent>) => {
    pushUndo(shapes);
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, x: e.target.x(), y: e.target.y() } : s
      )
    );
    markDirty();
  };

  // Manual save
  const handleManualSave = async () => {
    dirtyRef.current = true;
    // Trigger the interval immediately by setting dirty and flushing
    setSaveStatus("saving");
    setSaving(true);

    try {
      const canvasData = { shapes, bgPhotoIndex: photoIndex };

      if (schematicRef.current) {
        await fetch("/api/schematics", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: schematicRef.current.id,
            canvas_data: canvasData,
            name: schematicName,
          }),
        });
      } else {
        const res = await fetch("/api/schematics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            name: schematicName,
            canvas_data: canvasData,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setSchematic(created);
          schematicRef.current = created;
        }
      }
      dirtyRef.current = false;
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--surface-3)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  const renderShape = (shape: ShapeData) => {
    const isDraggable = activeTool === "select";
    const isSelected = selectedId === shape.id;

    switch (shape.type) {
      case "pen":
        return (
          <Line
            key={shape.id}
            id={shape.id}
            points={shape.points || []}
            stroke={shape.stroke || "#ffffff"}
            strokeWidth={shape.strokeWidth || 4}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
            draggable={isDraggable}
            onClick={() => isDraggable && setSelectedId(shape.id)}
            onTap={() => isDraggable && setSelectedId(shape.id)}
            onDragEnd={(e) => handleDragEnd(shape.id, e)}
            hitStrokeWidth={20}
          />
        );

      case "line":
        return (
          <Line
            key={shape.id}
            id={shape.id}
            points={shape.linePoints || []}
            stroke={shape.stroke || "#ffffff"}
            strokeWidth={shape.strokeWidth || 4}
            lineCap="round"
            draggable={isDraggable}
            onClick={() => isDraggable && setSelectedId(shape.id)}
            onTap={() => isDraggable && setSelectedId(shape.id)}
            onDragEnd={(e) => handleDragEnd(shape.id, e)}
            hitStrokeWidth={20}
          />
        );

      case "rect":
        return (
          <Rect
            key={shape.id}
            id={shape.id}
            x={shape.x || 0}
            y={shape.y || 0}
            width={shape.width || 0}
            height={shape.height || 0}
            stroke={shape.stroke || "#ffffff"}
            strokeWidth={shape.strokeWidth || 4}
            draggable={isDraggable}
            onClick={() => isDraggable && setSelectedId(shape.id)}
            onTap={() => isDraggable && setSelectedId(shape.id)}
            onDragEnd={(e) => handleDragEnd(shape.id, e)}
          />
        );

      case "text":
        return (
          <Text
            key={shape.id}
            id={shape.id}
            x={shape.x || 0}
            y={shape.y || 0}
            text={shape.text || ""}
            fontSize={shape.fontSize || 16}
            fill={shape.fill || "#ffffff"}
            fontFamily="JetBrains Mono, monospace"
            draggable={isDraggable}
            onClick={() => isDraggable && setSelectedId(shape.id)}
            onTap={() => isDraggable && setSelectedId(shape.id)}
            onDragEnd={(e) => handleDragEnd(shape.id, e)}
          />
        );

      case "camera":
        return (
          <Group
            key={shape.id}
            id={shape.id}
            x={shape.x || 0}
            y={shape.y || 0}
            rotation={shape.rotation || 0}
            draggable={isDraggable}
            onClick={() => isDraggable && setSelectedId(shape.id)}
            onTap={() => isDraggable && setSelectedId(shape.id)}
            onDragEnd={(e) => handleDragEnd(shape.id, e)}
          >
            {/* Camera body */}
            {shape.cameraType === "dome" ? (
              <>
                <Circle radius={14} fill={shape.fill || "#ffffff"} stroke={isSelected ? "#00c8ff" : "#333"} strokeWidth={isSelected ? 2 : 1} />
                <Circle radius={5} fill="#333" />
              </>
            ) : shape.cameraType === "bullet" ? (
              <>
                <Rect x={-16} y={-8} width={32} height={16} fill={shape.fill || "#ffffff"} stroke={isSelected ? "#00c8ff" : "#333"} strokeWidth={isSelected ? 2 : 1} cornerRadius={3} />
                <Circle x={10} radius={4} fill="#333" />
              </>
            ) : (
              <>
                <Circle radius={16} fill={shape.fill || "#ffffff"} stroke={isSelected ? "#00c8ff" : "#333"} strokeWidth={isSelected ? 2 : 1} />
                <Circle radius={8} fill="#555" />
                <Circle radius={3} fill="#333" />
              </>
            )}
            {/* View cone */}
            <RegularPolygon
              x={0}
              y={-30}
              sides={3}
              radius={18}
              rotation={180}
              fill={(shape.fill || "#ffffff") + "40"}
              stroke={(shape.fill || "#ffffff") + "80"}
              strokeWidth={1}
            />
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg)] flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center gap-2 px-3 border-b border-[var(--border)] bg-[var(--surface-1)] z-10 flex-shrink-0">
        <button
          onClick={() => {
            if (dirtyRef.current) handleManualSave();
            router.back();
          }}
          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[var(--text-secondary)]">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
          </svg>
        </button>

        <input
          value={schematicName}
          onChange={(e) => {
            setSchematicName(e.target.value);
            markDirty();
          }}
          className="flex-1 bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none mono tracking-wide"
          placeholder="Schematic name..."
        />

        <span className={`text-[10px] mono tracking-wider px-2 py-1 rounded ${
          saveStatus === "saved" ? "text-[var(--success)]" :
          saveStatus === "saving" ? "text-[var(--warning)]" :
          "text-[var(--text-tertiary)]"
        }`}>
          {saveStatus === "saved" ? "SAVED" : saveStatus === "saving" ? "SAVING..." : "UNSAVED"}
        </span>

        <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 rounded-lg hover:bg-[var(--surface-2)] disabled:opacity-30 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[var(--text-secondary)]">
            <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 rounded-lg hover:bg-[var(--surface-2)] disabled:opacity-30 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[var(--text-secondary)]">
            <path fillRule="evenodd" d="M14.47 2.47a.75.75 0 011.06 0l6 6a.75.75 0 010 1.06l-6 6a.75.75 0 11-1.06-1.06l4.72-4.72H9a5.25 5.25 0 100 10.5h3a.75.75 0 010 1.5H9a6.75 6.75 0 010-13.5h10.19l-4.72-4.72a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ touchAction: "none" }}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={activeTool === "select"}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={(e) => {
            handleStageMouseMove();
            handleTouchMove(e);
          }}
          onTouchEnd={() => {
            handleStageMouseUp();
            handleTouchEnd();
          }}
        >
          {/* Background layer */}
          <Layer>
            {/* White canvas background */}
            <Rect
              x={-5000}
              y={-5000}
              width={10000}
              height={10000}
              fill="#f8f8f8"
              listening={false}
            />
            {/* Grid dots */}
            {(() => {
              const gridSize = 40;
              const dots: React.ReactNode[] = [];
              for (let x = -2000; x < 2000; x += gridSize) {
                for (let y = -2000; y < 2000; y += gridSize) {
                  dots.push(
                    <Circle
                      key={`grid_${x}_${y}`}
                      x={x}
                      y={y}
                      radius={1}
                      fill="#ccc"
                      listening={false}
                    />
                  );
                }
              }
              return dots;
            })()}
            {/* Background photo */}
            {bgImage && (
              <KonvaImage
                image={bgImage}
                x={0}
                y={0}
                width={bgImage.width}
                height={bgImage.height}
                opacity={0.7}
                listening={false}
              />
            )}
          </Layer>

          {/* Shapes layer */}
          <Layer>
            {shapes.map(renderShape)}

            {/* Temp drawing line */}
            {isDrawing && currentLine.length >= 4 && (
              <Line
                points={currentLine}
                stroke={penColor}
                strokeWidth={strokeWidth}
                lineCap="round"
                lineJoin="round"
                tension={0.5}
                listening={false}
              />
            )}

            {/* Temp rect */}
            {tempRect && (
              <Rect
                x={tempRect.x}
                y={tempRect.y}
                width={tempRect.w}
                height={tempRect.h}
                stroke={penColor}
                strokeWidth={strokeWidth}
                dash={[8, 4]}
                listening={false}
              />
            )}

            {/* Line start marker */}
            {lineStart && (
              <Circle
                x={lineStart.x}
                y={lineStart.y}
                radius={4}
                fill={penColor}
                listening={false}
              />
            )}
          </Layer>
        </Stage>

        {/* Text input overlay */}
        {textInput.visible && (
          <div
            className="absolute z-20"
            style={{
              left: textInput.x * stageScale + stagePos.x,
              top: textInput.y * stageScale + stagePos.y,
            }}
          >
            <input
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSubmit();
                if (e.key === "Escape") setTextInput({ ...textInput, visible: false });
              }}
              onBlur={handleTextSubmit}
              className="bg-[var(--surface-1)] border border-[var(--accent)] rounded px-2 py-1 text-sm text-[var(--text-primary)] outline-none mono min-w-[120px]"
              placeholder="Type label..."
            />
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <SchematicToolbar
        activeTool={activeTool}
        onToolChange={(tool) => {
          setActiveTool(tool);
          setSelectedId(null);
          setLineStart(null);
          setRectStart(null);
          setTempRect(null);
        }}
        penColor={penColor}
        onPenColorChange={setPenColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onCameraSelect={(type) => {
          setPendingCameraType(type);
          setActiveTool("camera");
        }}
      />
    </div>
  );
}
