"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
}

export default function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blankRef = useRef<string>("");
  const isDrawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    blankRef.current = canvas.toDataURL();
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas]);

  const checkInk = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = canvas.toDataURL();
    const inkDetected = current !== blankRef.current;
    setHasInk(inkDetected);
    onChange(inkDetected ? current : null);
  }, [onChange]);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) e.preventDefault();
    isDrawing.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    if ("touches" in e) e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawing.current = false;
    checkInk();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blankRef.current = canvas.toDataURL();
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-white/60 font-mono uppercase tracking-wider">
          Signature
        </label>
        {hasInk && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-white/40 hover:text-white/70 font-mono uppercase"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative rounded-lg border border-white/20 bg-white/5 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: 200 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/20 font-mono text-sm">
              Sign here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
