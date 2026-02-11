# Webflow Embed Instructions

## How to use in Webflow

1. **Build the bundle** (locally after exporting from Lovable):
   ```bash
   npx vite build --config vite.config.webflow.ts
   ```
   This creates `dist-webflow/particle-reveal-hero.iife.js`.

2. **Host the JS file** — upload it to your CDN, Webflow assets, or any file host.

3. **Add an Embed block** in Webflow with this code:
   ```html
   <div id="particle-reveal-hero" style="width:100%;height:100vh;margin:0;padding:0;"></div>
   <script src="YOUR_HOSTED_URL/particle-reveal-hero.iife.js"></script>
   ```

4. **Set the parent section** in Webflow to:
   - Width: 100%
   - Height: 100vh
   - Padding: 0
   - Overflow: hidden

## Customizing

- **Text**: Edit `src/components/HeroSection.tsx` — change the `<h1>` and `<p>` content
- **Colors**: Change `#224F3C` (background) and `#00BF6F` (accent) in HeroSection.tsx
- **Shader settings**: Adjust `LiquidMetal` props (speed, distortion, scale, etc.)
