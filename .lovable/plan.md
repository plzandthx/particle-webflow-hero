
# Particle Reveal Hero Section (Webflow-Compatible)

## Overview
A full-viewport hero section with an interactive particle trail effect that "reveals" a liquid metal shader background underneath. When the user moves their mouse, particles appear and dissolve, revealing the animated shader beneath through an SVG mask. The hero displays centered headline text with placeholder copy, using the dark green color scheme from the liquid metal example.

## Features

### 1. Particle Trail Animation Layer
- SVG-based particle system that follows the mouse cursor
- Particles emit from cursor movement, grow, then shrink and disappear
- "Gooey" SVG filter creates a smooth, organic blob effect
- Particles act as a mask, revealing the background shader wherever they appear

### 2. Liquid Metal Shader Background
- Animated WebGL shader behind the particle mask using `@paper-design/shaders-react`
- Dark green (#224F3C) background with green (#00BF6F) metallic tint
- Diamond-shaped liquid metal pattern with slow animation
- Uses the provided SVG image asset for the shader texture

### 3. Hero Text Overlay
- Large, bold placeholder headline centered on screen (e.g., "Your Brand Here")
- Subtitle text beneath
- Text scales dramatically using the `char-scale` keyframe animation
- White text on the dark background for contrast

### 4. Custom Cursor
- Small custom cursor element that follows mouse position with smooth easing
- Adds polish to the interactive reveal experience

### 5. Full Viewport Layout
- 100vh height, full-width section
- Fully responsive — adapts to any screen size
- No navigation or CTA — just the animation and text

### 6. Webflow-Compatible Export
- Build the hero as a self-contained, bundled JS file
- The bundle mounts itself into a target `<div>` that can be placed in a Webflow embed block
- Include minimal inline CSS so no external stylesheets are needed
- Provide simple embed instructions (a `<div>` + `<script>` tag to paste into Webflow)

## Dependencies
- `gsap` — for particle animation timelines
- `@paper-design/shaders-react` — for the liquid metal WebGL background

## Color Palette
- Background: #224F3C (dark green)
- Accent/Tint: #00BF6F (green)
- Text: #FFFFFF (white)
- Particles: #FFFFFF (white)
