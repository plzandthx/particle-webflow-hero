import React from 'react';
import { createRoot } from 'react-dom/client';
import HeroSection from './components/HeroSection';

// Self-mounting entry point for Webflow embed
const MOUNT_ID = 'particle-reveal-hero';

function mount() {
  const container = document.getElementById(MOUNT_ID);
  if (!container) {
    console.warn(`[ParticleRevealHero] No element with id="${MOUNT_ID}" found.`);
    return;
  }
  if (container.dataset.mounted === 'true') return;
  container.dataset.mounted = 'true';
  // Reset container styles
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.width = '100%';
  container.style.height = '100vh';

  const root = createRoot(container);
  root.render(<HeroSection />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
