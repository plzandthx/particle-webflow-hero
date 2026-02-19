import React, { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { LiquidMetal } from '@paper-design/shaders-react';
import heroLogoPng from '../assets/hero-logo.png';
import smPillDashGif from '../assets/sm-pill-dash.gif';
import smPillDashWebm from '../assets/sm-pill-dash.webm';

class ShaderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

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

// Inline layout types
interface PositionedImage {
  type: 'image';
  key: 'heroLogo' | 'smLogo';
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  lineIndex: number;
}

interface PositionedWord {
  type: 'word';
  key: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  charStart: number;
  charEnd: number;
  lineIndex: number;
}

type PositionedElement = PositionedImage | PositionedWord;

// Inline layout engine — flows images and text words left-to-right with line wrapping
function computeInlineLayout(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  smLogoImg: HTMLImageElement,
  fontSize: number,
  maxWidth: number,
  canvasWidth: number,
  canvasHeight: number,
  isMobile: boolean,
): PositionedElement[] {
  const lineHeight = fontSize * 1.15;
  const imageHeight = fontSize * 1.2 * (isMobile ? 1.5 : 1);
  const imageGap = fontSize * 0.3;
  const spaceWidth = ctx.measureText(' ').width;

  // Known aspect ratios from actual image files
  const heroWidth = imageHeight * (298 / 190);
  const smWidth = imageHeight * (308 / 164);

  // Flow item type (local to layout computation)
  type FlowItem = {
    type: 'image' | 'word';
    key: 'heroLogo' | 'smLogo' | 'text';
    img?: HTMLImageElement;
    text?: string;
    itemWidth: number;
    renderWidth: number;
    height: number;
    charStart?: number;
    charEnd?: number;
  };

  const flowItems: FlowItem[] = [];

  // Segment 1: hero logo
  flowItems.push({
    type: 'image', key: 'heroLogo', img: logoImg,
    itemWidth: heroWidth + imageGap, renderWidth: heroWidth, height: imageHeight,
  });

  // Segment 2: all text words
  const textWords = 'Building something special at SurveyMonkey'.split(' ');
  let charOff = 0;
  for (const word of textWords) {
    const w = ctx.measureText(word).width;
    flowItems.push({
      type: 'word', key: 'text', text: word,
      itemWidth: w + spaceWidth, renderWidth: w, height: lineHeight,
      charStart: charOff, charEnd: charOff + word.length,
    });
    charOff += word.length + 1;
  }

  // Segment 3: SM pill logo
  flowItems.push({
    type: 'image', key: 'smLogo', img: smLogoImg,
    itemWidth: smWidth + imageGap, renderWidth: smWidth, height: imageHeight,
  });

  // Flow layout: left-to-right with line wrapping
  type FlowLine = { items: { item: FlowItem; x: number }[]; width: number; maxHeight: number };
  const lines: FlowLine[] = [{ items: [], width: 0, maxHeight: lineHeight }];
  let cursorX = 0;

  for (const item of flowItems) {
    if (cursorX + item.renderWidth > maxWidth && lines[lines.length - 1].items.length > 0) {
      lines.push({ items: [], width: 0, maxHeight: lineHeight });
      cursorX = 0;
    }
    const line = lines[lines.length - 1];
    line.items.push({ item, x: cursorX });
    cursorX += item.itemWidth;
    line.width = cursorX;
    line.maxHeight = Math.max(line.maxHeight, item.height);
  }

  // Trim trailing space/gap from each line's width
  for (const line of lines) {
    if (line.items.length > 0) {
      const last = line.items[line.items.length - 1].item;
      line.width -= (last.itemWidth - last.renderWidth);
    }
  }

  // Calculate total height and vertical centering at 50%
  let totalHeight = 0;
  for (const line of lines) totalHeight += line.maxHeight;
  const blockStartY = canvasHeight * 0.5 - totalHeight / 2;

  // Position elements with center alignment per line
  const result: PositionedElement[] = [];
  let yOff = blockStartY;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const xOff = (canvasWidth - line.width) / 2;

    for (const { item, x } of line.items) {
      if (item.type === 'image') {
        result.push({
          type: 'image',
          key: item.key as 'heroLogo' | 'smLogo',
          img: item.img!,
          x: x + xOff,
          y: yOff + (line.maxHeight - item.height) / 2,
          width: item.renderWidth,
          height: item.height,
          lineIndex: li,
        });
      } else {
        result.push({
          type: 'word',
          key: item.key as 'text',
          text: item.text!,
          x: x + xOff,
          y: yOff + line.maxHeight / 2,
          width: item.renderWidth,
          charStart: item.charStart!,
          charEnd: item.charEnd!,
          lineIndex: li,
        });
      }
    }
    yOff += line.maxHeight;
  }

  return result;
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef<Mouse>({ x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0, prevSmX: 0, prevSmY: 0 });
  const hasFirstInputRef = useRef(false);
  const particlesRef = useRef<ParticleData[]>([]);
  const rafRef = useRef<number>();
  const isTouchRef = useRef(false);

  const snapMouseTo = useCallback((x: number, y: number) => {
    const m = mouseRef.current;
    m.x = x; m.y = y;
    m.smoothX = x; m.smoothY = y;
    m.prevSmX = x; m.prevSmY = y;
    m.diff = 0;
    hasFirstInputRef.current = true;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchRef.current = true;
    const touch = e.touches[0];
    if (!touch || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    snapMouseTo(touch.clientX - r.left, touch.clientY - r.top);
  }, [snapMouseTo]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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

    // Preload logo images
    const logoImg = new Image();
    logoImg.src = heroLogoPng;
    const smLogoImg = new Image();
    smLogoImg.src = smPillDashGif;

    // Off-screen video element for SM pill animation (WebM)
    const video = document.createElement('video');
    video.src = smPillDashWebm;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none;';
    document.body.appendChild(video);

    let cssW = container.offsetWidth;
    let cssH = container.offsetHeight;

    // Animation state (tweened by GSAP master timeline)
    const anim = {
      heroLogoOpacity: 0,
      heroLogoXOffset: -20,
      textCharCount: 0,
      smLogoOpacity: 0,
      smLogoXOffset: -20,
      cursorVisible: true,
      cursorHidden: false,
    };

    const textLength = 42; // "Building something special at SurveyMonkey"

    // GSAP master timeline — sequenced intro animation
    const masterTL = gsap.timeline({ delay: 0.3 });

    // Phase 1: Hero logo fades in with left-to-right shift
    masterTL.to(anim, {
      heroLogoOpacity: 1, heroLogoXOffset: 0,
      duration: 0.35, ease: 'power3.out',
    });

    // Phase 2: Typewriter "Building something special at SurveyMonkey"
    masterTL.to(anim, {
      textCharCount: textLength,
      duration: textLength * 0.08,
      ease: 'none',
    });

    // Start WebM video playback when SM pill begins to appear
    masterTL.call(() => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });

    // Phase 3: SM pill WebM fades in with left-to-right shift
    masterTL.to(anim, {
      smLogoOpacity: 1, smLogoXOffset: 0,
      duration: 0.35, ease: 'power3.out',
    });

    // Hide cursor 3s after all typing completes
    masterTL.call(() => {
      setTimeout(() => { anim.cursorHidden = true; }, 3000);
    });

    // Cursor blink (independent of timeline)
    const cursorBlinkInterval = setInterval(() => {
      anim.cursorVisible = !anim.cursorVisible;
    }, 500);

    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const r = container.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      if (!hasFirstInputRef.current) {
        hasFirstInputRef.current = true;
        mouse.smoothX = mx;
        mouse.smoothY = my;
        mouse.prevSmX = mx;
        mouse.prevSmY = my;
      }
      mouse.x = mx;
      mouse.y = my;
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

    const drawTextOnCanvas = () => {
      const vwSize = cssW * 0.08;
      const fontSize = Math.max(28, Math.min(vwSize, 112));
      const maxTextWidth = cssW * 0.85;
      const isMobile = cssW < 768;

      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `400 ${fontSize}px 'Inter Tight', 'Inter', system-ui, sans-serif`;
      ctx.fillStyle = '#343835';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Compute inline layout (stable positions from full content — no layout shift)
      const elements = computeInlineLayout(
        ctx, logoImg, smLogoImg, fontSize, maxTextWidth, cssW, cssH, isMobile
      );

      const textChars = Math.floor(anim.textCharCount);

      // Track cursor position
      let cursorPosX = 0;
      let cursorPosY = 0;
      let showCursorReady = false;

      for (const el of elements) {
        if (el.type === 'image') {
          const isHero = el.key === 'heroLogo';
          const opacity = isHero ? anim.heroLogoOpacity : anim.smLogoOpacity;
          const xOffset = isHero ? anim.heroLogoXOffset : anim.smLogoXOffset;

          if (opacity <= 0) continue;

          if (isHero) {
            // Draw hero logo on canvas
            if (el.img.complete && el.img.naturalHeight > 0) {
              const prevAlpha = ctx.globalAlpha;
              ctx.globalAlpha = opacity;
              ctx.drawImage(el.img, el.x + xOffset, el.y, el.width, el.height);
              ctx.globalAlpha = prevAlpha;
            }
          } else {
            // Draw current video frame onto canvas so particles erase it like other content
            const prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha = opacity;
            if (video.readyState >= 2) {
              ctx.drawImage(video, el.x + xOffset, el.y, el.width, el.height);
            } else {
              // Fallback: draw static GIF image until video is ready
              ctx.drawImage(el.img, el.x + xOffset, el.y, el.width, el.height);
            }
            ctx.globalAlpha = prevAlpha;
          }

          // Set initial cursor position after hero logo (before any text)
          if (isHero && opacity >= 0.99 && !showCursorReady) {
            cursorPosX = el.x + el.width;
            cursorPosY = el.y + el.height / 2;
            showCursorReady = true;
          }
        } else {
          const segChars = textChars;

          if (segChars <= el.charStart) continue;

          if (segChars >= el.charEnd) {
            // Word fully revealed
            ctx.fillText(el.text, el.x, el.y);
            cursorPosX = el.x + el.width;
            cursorPosY = el.y;
            showCursorReady = true;
          } else {
            // Word partially revealed
            const visCount = segChars - el.charStart;
            const partial = el.text.substring(0, visCount);
            ctx.fillText(partial, el.x, el.y);
            cursorPosX = el.x + ctx.measureText(partial).width;
            cursorPosY = el.y;
            showCursorReady = true;
          }
        }
      }

      // Blinking cursor after last visible character
      if (showCursorReady && anim.cursorVisible && !anim.cursorHidden) {
        ctx.fillText('|', cursorPosX + 4, cursorPosY);
      }
    };

    const loop = () => {
      mouse.prevSmX = mouse.smoothX;
      mouse.prevSmY = mouse.smoothY;
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.15;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.15;
      mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

      emitParticles();

      if (cursorRef.current) {
        cursorRef.current.style.display = isTouchRef.current ? 'none' : 'block';
        cursorRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      }

      // 1. Fill solid background
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#e4ded6';
      ctx.fillRect(0, 0, cssW, cssH);

      // 2. Draw text onto the overlay (so it gets erased with the overlay)
      drawTextOnCanvas();

      // 3. Cut holes where particles are
      ctx.globalCompositeOperation = 'destination-out';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
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
      masterTL.kill();
      clearInterval(cursorBlinkInterval);
      particles.forEach(p => p.tl.kill());
      particles.length = 0;
      video.pause();
      video.src = '';
      if (video.parentNode) video.parentNode.removeChild(video);
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
        touchAction: 'pan-y',
        backgroundColor: '#e4ded6',
        cursor: 'none',
      }}
    >
      {/* Layer 0: Liquid Metal shader (always visible underneath) */}
      <ShaderErrorBoundary>
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
            style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}
          />
        </div>
      </ShaderErrorBoundary>

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 200,
          background: 'transparent',
          touchAction: 'pan-y',
        }}
      />
    </section>
  );
}
