import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Mouse {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
  diff: number;
  vx: number;
  vy: number;
}

class Particle {
  size: number;
  x: number;
  y: number;
  el: SVGCircleElement;

  constructor(x: number, y: number, size: number, particles: Particle[]) {
    this.size = size;
    this.x = x;
    this.y = y;

    this.el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.el.setAttribute('cx', this.x.toString());
    this.el.setAttribute('cy', this.y.toString());
    this.el.setAttribute('r', this.size.toString());
    this.el.setAttribute('fill', '#fff');

    const tl = gsap.timeline();
    tl.to(this, { size: this.size * 2, ease: 'power1.inOut', duration: 2 });
    tl.to(this, { size: 0, ease: 'power4.in', duration: 4 }, 3);
    tl.call(() => this.kill(particles));
  }

  kill(particles: Particle[]) {
    const index = particles.indexOf(this);
    if (index > -1) particles.splice(index, 1);
    this.el.remove();
  }

  render() {
    this.el.setAttribute('cx', this.x.toString());
    this.el.setAttribute('cy', this.y.toString());
    this.el.setAttribute('r', this.size.toString());
  }
}

interface ParticleAnimationProps {
  className?: string;
}

export default function ParticleAnimation({ className }: ParticleAnimationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<SVGGElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef<Mouse>({
    x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0, vx: 0, vy: 0,
  });
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    const mouse = mouseRef.current;
    const particles = particlesRef.current;
    const container = containerRef.current;

    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.vx += mouse.x - (e.clientX - rect.left);
      mouse.vy += mouse.y - (e.clientY - rect.top);
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const updateSize = () => {
      if (svgRef.current && container) {
        svgRef.current.setAttribute('width', container.offsetWidth.toString());
        svgRef.current.setAttribute('height', container.offsetHeight.toString());
      }
    };

    const emitParticle = () => {
      if (mouse.diff > 0.01) {
        const particle = new Particle(mouse.smoothX, mouse.smoothY, mouse.diff * 0.2, particles);
        particles.push(particle);
        wrapperRef.current?.prepend(particle.el);
      }
    };

    const render = () => {
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.1;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.1;
      mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

      emitParticle();

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mouse.smoothX}px, ${mouse.smoothY}px)`;
      }

      particles.forEach((p) => p.render());
      animationIdRef.current = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', updateSize);
    updateSize();
    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', updateSize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Custom cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          top: -6,
          left: -6,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none',
          zIndex: 50,
          mixBlendMode: 'difference',
        }}
      />

      {/* SVG particle mask layer */}
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}
      >
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -7"
              result="goo"
            />
          </filter>
        </defs>
        <mask id="particle-mask">
          <g ref={wrapperRef} filter="url(#gooey)" />
        </mask>
      </svg>
    </div>
  );
}
