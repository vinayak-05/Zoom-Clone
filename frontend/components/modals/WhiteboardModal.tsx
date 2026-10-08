"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Pen,
  Highlighter,
  Eraser,
  RotateCcw,
  Download,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  "#000000",
  "#0B5CFF",
  "#E11D48",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EA580C",
  "#FFFFFF",
];

const STROKE_SIZES = [
  { label: "Thin", size: 2 },
  { label: "Medium", size: 5 },
  { label: "Thick", size: 10 },
  { label: "Marker", size: 18 },
];

export function WhiteboardModal({ isOpen, onClose }: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [selectedColor, setSelectedColor] = useState("#0B5CFF");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions to display container size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Initial white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Save initial state to history
    const initialImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialImg]);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = strokeWidth * 3;
      ctx.globalAlpha = 1.0;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (tool === "highlighter") {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth * 2.5;
      ctx.globalAlpha = 0.35;
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";
    } else {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1.0;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();

    // Push state to undo history (keep last 20 steps)
    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-19), currentImg]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nextHistory = [...history];
    nextHistory.pop(); // remove current state
    const previousState = nextHistory[nextHistory.length - 1];

    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHistory(nextHistory);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cleared = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, cleared]);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `Zoom-Whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 border border-gray-200 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh]"
        }`}
      >
        {/* Header toolbar */}
        <div className="bg-[#1C1C28] text-white px-4 py-2.5 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              Zoom Whiteboard
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              Collaborative Meeting Canvas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold px-2.5"
              title="Download canvas as PNG"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save Image</span>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
              title="Close Whiteboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main interactive controls bar */}
        <div className="bg-[#F8FAFC] border-b border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tools: Pen, Highlighter, Eraser */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setTool("pen")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                tool === "pen"
                  ? "bg-[#0B5CFF] text-white shadow-xs"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Pen className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => setTool("highlighter")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                tool === "highlighter"
                  ? "bg-[#0B5CFF] text-white shadow-xs"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlighter</span>
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                tool === "eraser"
                  ? "bg-[#0B5CFF] text-white shadow-xs"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Palette Colors */}
          {tool !== "eraser" && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 shadow-xs">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border border-gray-300 transition-transform ${
                    selectedColor === c ? "scale-125 ring-2 ring-blue-500 ring-offset-1" : "hover:scale-110"
                  }`}
                  title={c}
                />
              ))}
            </div>
          )}

          {/* Stroke Width buttons */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl p-1 shadow-xs">
            {STROKE_SIZES.map((sz) => (
              <button
                key={sz.size}
                onClick={() => setStrokeWidth(sz.size)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  strokeWidth === sz.size
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {sz.label}
              </button>
            ))}
          </div>

          {/* Actions: Undo & Clear */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-colors font-medium"
              title="Undo last stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors font-medium"
              title="Clear entire canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Drawing Canvas Area */}
        <div className="flex-1 w-full h-full relative bg-white cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full touch-none"
          />
        </div>
      </div>
    </div>
  );
}
