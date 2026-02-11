import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LiquidMetal } from '@paper-design/shaders-react';

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
    this.el.setAttribute('fill', '#ffffff');
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
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        svgRef.current.setAttribute('width', w.toString());
        svgRef.current.setAttribute('height', h.toString());
        svgRef.current.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    };

    const loop = () => {
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.45;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.45;
      mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

      if (mouse.diff > 0.005) {
        const p = new Particle(mouse.smoothX, mouse.smoothY, mouse.diff * 0.25, particles);
        particles.push(p);
        maskGroupRef.current?.prepend(p.el);
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
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
        backgroundColor: '#F5F5F5',
        cursor: 'none',
      }}
    >
      {/* SVG with mask + filter definitions */}
      <svg
        ref={svgRef}
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -7"
            />
          </filter>
        </defs>
        <mask id="particle-mask" maskUnits="userSpaceOnUse">
          <g ref={maskGroupRef} filter="url(#gooey)" />
        </mask>
      </svg>

      {/* Layer 1: Liquid Metal shader, masked by particle SVG mask */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          mask: 'url(#particle-mask)',
          WebkitMask: 'url(#particle-mask)',
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
            color: '#343835',
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
            color: 'rgba(52,56,53,0.6)',
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
    </section>
  );
}
