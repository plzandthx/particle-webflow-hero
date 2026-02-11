import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LiquidMetal } from '@paper-design/shaders-react';

// ─── Particle system ────────────────────────────────────────────

interface Mouse {
  x: number; y: number; smoothX: number; smoothY: number; diff: number;
}

class Particle {
  size: number; x: number; y: number; el: SVGCircleElement;
  constructor(x: number, y: number, size: number, particles: Particle[]) {
    this.size = size; this.x = x; this.y = y;
    this.el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.el.setAttribute('cx', x.toString());
    this.el.setAttribute('cy', y.toString());
    this.el.setAttribute('r', size.toString());
    this.el.setAttribute('fill', '#fff');
    const tl = gsap.timeline();
    tl.to(this, { size: size * 2, ease: 'power1.inOut', duration: 2 });
    tl.to(this, { size: 0, ease: 'power4.in', duration: 4 }, 3);
    tl.call(() => this.kill(particles));
  }
  kill(particles: Particle[]) {
    const i = particles.indexOf(this);
    if (i > -1) particles.splice(i, 1);
    this.el.remove();
  }
  render() {
    this.el.setAttribute('cx', this.x.toString());
    this.el.setAttribute('cy', this.y.toString());
    this.el.setAttribute('r', this.size.toString());
  }
}

// ─── Hero component ─────────────────────────────────────────────

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const maskGroupRef = useRef<SVGGElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef<Mouse>({ x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>();

  useEffect(() => {
    const mouse = mouseRef.current;
    const particles = particlesRef.current;
    const container = containerRef.current;

    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const r = container.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };

    const updateSize = () => {
      if (svgRef.current && container) {
        svgRef.current.setAttribute('width', container.offsetWidth.toString());
        svgRef.current.setAttribute('height', container.offsetHeight.toString());
      }
    };

    const loop = () => {
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.1;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.1;
      mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

      if (mouse.diff > 0.01) {
        const p = new Particle(mouse.smoothX, mouse.smoothY, mouse.diff * 0.2, particles);
        particles.push(p);
        maskGroupRef.current?.prepend(p.el);
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mouse.smoothX}px, ${mouse.smoothY}px)`;
      }

      particles.forEach((p) => p.render());
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
        backgroundColor: '#224F3C',
        cursor: 'none',
      }}
    >
      {/* Layer 1: Liquid Metal shader (revealed through mask) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'url(#particle-clip)',
          WebkitClipPath: 'url(#particle-clip)',
          zIndex: 10,
        }}
      >
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
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#224F3C',
          }}
        />
      </div>

      {/* Layer 2: Text overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            fontSize: 'clamp(2.5rem, 8vw, 7rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            margin: 0,
            padding: '0 1rem',
          }}
        >
          Your Brand
          <br />
          Here
        </h1>
        <p
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            marginTop: '1.5rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Move your cursor to reveal
        </p>
      </div>

      {/* Custom cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.8)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      {/* SVG mask driven by particles */}
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}
        width="100"
        height="100"
      >
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -7"
            />
          </filter>
          <clipPath id="particle-clip">
            <g ref={maskGroupRef} filter="url(#gooey-filter)" />
          </clipPath>
        </defs>
      </svg>
    </section>
  );
}
