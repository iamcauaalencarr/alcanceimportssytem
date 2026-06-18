import { useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
}

export default function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 180; // Fixed height for signing area
      
      // Reset drawing state since resizing clears canvas
      clearSignature();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling on touch devices when signing
    if (e.cancelable) e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A'; // Slate-900 (nice dark ink)
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Send updated image data to parent
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setIsDrawing(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">
          Assinatura Digital do Cliente
        </label>
        {hasDrawn && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-1 text-[10px] font-extrabold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar Assinatura
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-gray-250 dark:border-zinc-700 hover:border-brand-primary/50 dark:hover:border-brand-primary/50 bg-gray-50/50 dark:bg-zinc-800/20 rounded-2xl overflow-hidden transition-all h-[180px] w-full cursor-crosshair shadow-inner"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full touch-none"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-center p-4">
            <span className="text-xs font-medium text-brand-muted dark:text-zinc-400">
              Assine aqui usando o dedo ou mouse
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
