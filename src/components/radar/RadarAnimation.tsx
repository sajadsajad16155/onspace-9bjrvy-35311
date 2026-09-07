import { useEffect, useRef, useState } from 'react';

interface RadarDot {
  id: number;
  angle: number;
  distance: number;
  opacity: number;
  size: number;
  color: string;
}

interface Props {
  isScanning?: boolean;
  size?: number;
  dotCount?: number;
}

export default function RadarAnimation({ isScanning = false, size = 280, dotCount = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const [dots, setDots] = useState<RadarDot[]>([]);

  // Generate random dots when scanning
  useEffect(() => {
    if (isScanning && dotCount === 0) {
      const newDots: RadarDot[] = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        distance: (0.25 + Math.random() * 0.6) * (size / 2),
        opacity: 0.4 + Math.random() * 0.6,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.7 ? 'hsl(160,100%,50%)' : 'hsl(189,100%,50%)',
      }));
      setDots(newDots);
    }
  }, [isScanning, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 10;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.03)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Grid rings
      [0.25, 0.5, 0.75, 1].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Cross lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
      ctx.lineWidth = 0.5;
      [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((angle) => {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
        ctx.lineTo(cx - Math.cos(angle) * maxR, cy - Math.sin(angle) * maxR);
        ctx.stroke();
      });

      if (isScanning) {
        // Sweep gradient
        const sweepAngle = angleRef.current;
        const gradient = ctx.createConicalGradient
          ? null
          : null;

        // Draw sweep arc
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, sweepAngle - Math.PI / 3, sweepAngle, false);
        ctx.closePath();

        const radialGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        radialGrad.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
        radialGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = radialGrad;
        ctx.fill();

        // Sweep line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(sweepAngle) * maxR,
          cy + Math.sin(sweepAngle) * maxR
        );
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
        ctx.fill();

        // Draw result dots
        dots.forEach((dot) => {
          const x = cx + Math.cos(dot.angle) * dot.distance;
          const y = cy + Math.sin(dot.angle) * dot.distance;

          // Ping effect
          ctx.beginPath();
          ctx.arc(x, y, dot.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = dot.color.replace(')', ', 0.1)').replace('hsl', 'hsla');
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, dot.size, 0, Math.PI * 2);
          ctx.fillStyle = dot.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = dot.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        angleRef.current += 0.025;
      } else {
        // Static center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isScanning, size, dots]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: isScanning
            ? '0 0 40px rgba(0,229,255,0.15), inset 0 0 40px rgba(0,229,255,0.05)'
            : '0 0 20px rgba(0,229,255,0.05)',
          borderRadius: '50%',
          transition: 'box-shadow 0.5s ease',
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ borderRadius: '50%' }}
      />
      {/* HUD corner labels */}
      {isScanning && (
        <>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] tracking-widest font-mono animate-pulse"
            style={{ color: 'rgba(0,229,255,0.6)' }}>
            SCANNING
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] tracking-widest font-mono animate-pulse"
            style={{ color: 'rgba(0,229,255,0.4)' }}>
            PUBLIC SOURCES
          </div>
        </>
      )}
    </div>
  );
}
