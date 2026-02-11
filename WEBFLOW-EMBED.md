# Webflow Embed Instructions

The particle reveal hero is packaged as a standalone JavaScript file that can be embedded in any Webflow page. The bundle is automatically built and deployed to GitHub Pages whenever code is pushed to `main`.

**Bundle URL:** `https://plzandthx.github.io/particle-webflow-hero/particle-reveal-hero.iife.js`

---

## Step 1: Add the Google Font

Go to **Project Settings** (gear icon) > **Custom Code** > **Head Code** and paste:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400&display=swap" rel="stylesheet">
```

Click **Save Changes**.

## Step 2: Add a Section

In the Webflow Designer, add a **Section** as the **first element** on your page. Style it:

- **Width:** 100%
- **Height:** 100vh
- **Padding:** 0 on all sides
- **Overflow:** Hidden

## Step 3: Add the HTML Embed

Inside that Section, add an **HTML Embed** component (Add Elements panel > Components > HTML Embed). Paste this code:

```html
<div id="particle-reveal-hero" style="width:100%;height:100vh;margin:0;padding:0;"></div>
<script src="https://plzandthx.github.io/particle-webflow-hero/particle-reveal-hero.iife.js"></script>
```

## Step 4: Publish

Click **Publish** in Webflow. The hero renders as the first section. Build the rest of your page below it using the normal Webflow editor.

---

## Updating the hero

Any changes pushed to `main` in this repository are automatically rebuilt and deployed. The Webflow embed will pick up updates on the next page load (no Webflow changes needed).

## Customizing

- **Text**: Edit `src/components/HeroSection.tsx` — change the headline string
- **Colors**: Change `#224F3C` (background) and `#00BF6F` (accent) in HeroSection.tsx
- **Shader settings**: Adjust `LiquidMetal` props (speed, distortion, scale, etc.)
- **Logo**: Replace `src/assets/hero-logo.png` with your own image

## Building locally

```bash
npm run build:webflow
```

Output: `dist-webflow/particle-reveal-hero.iife.js`
