import React, { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { LiquidMetal } from '@paper-design/shaders-react';

interface Mouse {
  x: number; y: number; smoothX: number; smoothY: number; diff: number;
  prevSmX: number; prevSmY: number;
}

interface ParticleData {
  x: number;
  y: number;
  obj: { size: number };
  tl: gsap.core.Timeline;
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef<Mouse>({ x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0, prevSmX: 0, prevSmY: 0 });
  const particlesRef = useRef<ParticleData[]>([]);
  const rafRef = useRef<number>();
  const isTouchRef = useRef(false);

  const updateMouseFromTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouchRef.current = true;
    const touch = e.touches[0];
    if (!touch || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = touch.clientX - r.left;
    mouseRef.current.y = touch.clientY - r.top;
  }, []);

  useEffect(() => {
    const mouse = mouseRef.current;
    const particles = particlesRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cssW = container.offsetWidth;
    let cssH = container.offsetHeight;

    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const r = container.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };

    const updateSize = () => {
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      cssW = container.offsetWidth;
      cssH = container.offsetHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const addParticle = (x: number, y: number, size: number) => {
      const obj = { size };
      const p: ParticleData = { x, y, obj, tl: gsap.timeline() };
      const peakSize = size * 2.5;
      p.tl.to(obj, { size: peakSize, ease: 'power1.inOut', duration: 2 });
      p.tl.to(obj, { size: 0, ease: 'power4.in', duration: 4 }, 3);
      p.tl.call(() => {
        const i = particles.indexOf(p);
        if (i > -1) particles.splice(i, 1);
      });
      particles.push(p);
    };

    const emitParticles = () => {
      if (mouse.diff < 0.005) return;

      // Interpolate between previous and current smooth positions for organic strokes
      const dx = mouse.smoothX - mouse.prevSmX;
      const dy = mouse.smoothY - mouse.prevSmY;
      const dist = Math.hypot(dx, dy);
      const baseSize = mouse.diff * 0.3;
      const step = Math.max(baseSize * 0.4, 3); // spacing between interpolated particles

      if (dist > 1) {
        const steps = Math.ceil(dist / step);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const px = mouse.prevSmX + dx * t;
          const py = mouse.prevSmY + dy * t;
          addParticle(px, py, baseSize);
        }
      } else {
        addParticle(mouse.smoothX, mouse.smoothY, baseSize);
      }
    };

    // Precompute text layout for drawing on canvas
    const headline1 = 'Building something';
    const headline2 = 'special at SurveyMonkey';

    const drawTextOnCanvas = () => {
      // Calculate responsive font size matching clamp(2.5rem, 8vw, 7rem)
      const vwSize = cssW * 0.08;
      const fontSize = Math.max(40, Math.min(vwSize, 112));

      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `400 ${fontSize}px 'Inter Tight', 'Inter', system-ui, sans-serif`;
      ctx.fillStyle = '#343835';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lineHeight = fontSize * 1.05;
      const centerX = cssW / 2;
      const centerY = cssH / 2;

      ctx.fillText(headline1, centerX, centerY - lineHeight * 0.5);
      ctx.fillText(headline2, centerX, centerY + lineHeight * 0.5);
    };

    const loop = () => {
      mouse.prevSmX = mouse.smoothX;
      mouse.prevSmY = mouse.smoothY;
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.35;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.35;
      mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

      emitParticles();

      if (cursorRef.current) {
        cursorRef.current.style.display = isTouchRef.current ? 'none' : 'block';
        cursorRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      }

      // 1. Fill solid background
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, cssW, cssH);

      // 2. Draw text onto the overlay (so it gets erased with the overlay)
      drawTextOnCanvas();

      // 3. Cut holes where particles are
      ctx.globalCompositeOperation = 'destination-out';
      ctx.shadowColor = 'rgba(0,0,0,1)';
      ctx.shadowBlur = 25;
      ctx.fillStyle = 'rgba(0,0,0,1)';

      for (const p of particles) {
        const s = p.obj.size;
        if (s > 0.1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', updateSize);
    updateSize();
    loop();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', updateSize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particles.forEach(p => p.tl.kill());
      particles.length = 0;
    };
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
        backgroundColor: '#224F3C',
        cursor: 'none',
      }}
    >
      {/* Layer 0: Liquid Metal shader (always visible underneath) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <LiquidMetal
          speed={1}
          softness={0.1}
          repetition={2}
          shiftRed={-0.08}
          shiftBlue={0}
          distortion={0.07}
          contour={0.4}
          scale={0.34}
          rotation={0}
          shape="diamond"
          angle={70}
          image="https://workers.paper.design/file-assets/01KG192RZYT5JJA51WGJAQAPB1/01KG19A6K85VMBYSNTEEPCYHES.svg"
          colorBack="#00000000"
          colorTint="#00BF6F"
          style={{ width: '100%', height: '100%', backgroundColor: '#224F3C' }}
        />
      </div>

      {/* Layer 1: Canvas overlay — solid #F5F5F5 + text, with holes cut by particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {/* Custom cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          top: -24,
          left: -24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.8)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      {/* Touch capture overlay */}
      <div
        onTouchStart={updateMouseFromTouch}
        onTouchMove={updateMouseFromTouch}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 200,
          background: 'transparent',
          touchAction: 'none',
        }}
      />
    </section>
  );
}
