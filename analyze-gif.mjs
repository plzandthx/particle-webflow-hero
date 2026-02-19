import { readFileSync } from "fs";
import { parseGIF, decompressFrames } from "gifuct-js";

const gifBuffer = readFileSync("/home/user/particle-webflow-hero/src/assets/sm-pill-dash.gif");
const gif = parseGIF(gifBuffer);
const frames = decompressFrames(gif, true);

console.log("=== GIF Analysis: sm-pill-dash.gif ===\n");

// Logical Screen Descriptor
const lsd = gif.lsd;
console.log(`Logical Screen Dimensions: ${lsd.width} x ${lsd.height}`);
console.log(`Total Frames: ${frames.length}\n`);

// Per-frame details
let totalDelay = 0;
console.log("--- Per-Frame Details ---");
for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  const delay = f.delay;
  totalDelay += delay;
  const dims = f.dims;
  const disposal = f.disposalType;
  console.log(
    `Frame ${String(i).padStart(3, " ")}:  delay=${String(delay).padStart(5, " ")}ms  ` +
    `disposal=${disposal}  ` +
    `dims={ w: ${String(dims.width).padStart(4, " ")}, h: ${String(dims.height).padStart(4, " ")}, ` +
    `top: ${String(dims.top).padStart(4, " ")}, left: ${String(dims.left).padStart(4, " ")} }`
  );
}

console.log(`\n--- Summary ---`);
console.log(`Total animation duration: ${totalDelay} ms (${(totalDelay / 1000).toFixed(2)} s)`);
