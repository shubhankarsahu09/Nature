# Build a Fullscreen Hero Section for EventPro

Adapt this fullscreen hero section design for the EventPro event hosting platform. Use **Vite + React + TypeScript + Tailwind CSS**. Use `gsap` and `lucide-react` for animations and icons. No other UI libraries.

---

## Fonts (in `src/index.css`)

Import at the top of `index.css` **BEFORE** `@tailwind` directives:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');

@font-face {
  font-family: 'Dirtyline';
  src: url('https://fonts.cdnfonts.com/s/15011/Dirtyline36DaysofType.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

- **Heading font**: `'Playfair Display'` (bold, elegant for "Create Unforgettable Events")
- **Body font**: `'Inter'` (clean, modern)
- **Background**: `#000` (black, with video overlay)

---

## Tailwind Config (`tailwind.config.js`)

```js
theme: {
  extend: {
    fontFamily: {
      heading: ['Playfair Display', 'serif'],
      body: ['Inter', 'sans-serif'],
      dirtyline: ['Dirtyline', 'sans-serif'],
    },
    borderRadius: { DEFAULT: '9999px' },
    colors: {
      gold: '#D4AF37',
    },
  },
},
```

---

## CSS (append to `src/index.css`)

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0) 60%,
    rgba(255, 255, 255, 0.15) 80%,
    rgba(255, 255, 255, 0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.liquid-glass-strong::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0) 60%,
    rgba(255, 255, 255, 0.2) 80%,
    rgba(255, 255, 255, 0.5) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(72px, 15vw, 240px);
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: white;
  text-align: center;
  font-weight: 800;
}
```

---

## Component (`src/App.tsx`)

### Constants

```javascript
const NAV_LINKS = ['Gallery', 'Services', 'Testimonials', 'Blog', 'Contact'];
const VIDEO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/big_buck_bunny.mp4';
const COMPANY_NAME = 'EventPro';
```

### LogoMark

Create an inline SVG (44×26, viewBox `0 0 44 26`). Three white rounded rectangles representing event elements:
- **Rect 1**: x=0, y=3, width=14, height=20, rx=3 (left pillar)
- **Rect 2**: x=16, y=3, width=12, height=20, rx=3 (center stage)
- **Rect 3**: x=30, y=3, width=14, height=20, rx=3 (right pillar)

```tsx
const LogoMark = () => (
  <svg width="44" height="26" viewBox="0 0 44 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="3" width="14" height="20" rx="3" fill="white" />
    <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
    <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
  </svg>
);
```

### State & Refs

```typescript
const [mounted, setMounted] = useState(false);
const [framesReady, setFramesReady] = useState(false);
const videoRef = useRef<HTMLVideoElement>(null);
const videoBgRef = useRef<HTMLDivElement>(null);
const displayCanvasRef = useRef<HTMLCanvasElement>(null);
const framesRef = useRef<HTMLCanvasElement[]>([]);
```

### Effect 1 — Frame Capture (Boomerang Setup)

On mount:
1. Get `videoRef.current`
2. Set up `capturing = true`, `lastTime = -1`, `MAX_WIDTH = 960`, `frames: HTMLCanvasElement[] = []`
3. Define `captureFrame()`: 
   - Bail if `!capturing` or `readyState < 2` or `currentTime === lastTime`
   - Update `lastTime = video.currentTime`
   - Calculate scale: `scale = Math.min(1, 960 / videoWidth)`
   - Create offscreen canvas at scaled dimensions
   - Call `ctx.drawImage(video, 0, 0, w, h)` and push to frames
4. Use `requestVideoFrameCallback()` when available, fallback to `requestAnimationFrame()`
5. On `loadedmetadata`: call `video.play().catch(()=>{})` then start capture loop
6. On `ended`: set `capturing = false`, store frames in `framesRef.current`, call `setFramesReady(true)`
7. If `readyState >= 1`, invoke `onLoaded()` immediately
8. Cleanup: cancel RAF and remove event listeners

### Effect 2 — Boomerang Render

When `framesReady === true`:
1. Grab `displayCanvasRef.current`
2. Set `width/height` from `frames[0]`
3. Loop variables: `index = 0`, `direction = 1`, `last = performance.now()`, `interval = 1000/30` (30 FPS)
4. In `requestAnimationFrame(render)`:
   - If `now - last >= interval`: draw `frames[index]`, advance `index += direction`
   - When `index >= frames.length - 1`: clamp and flip `direction = -1`
   - When `index <= 0`: clamp and flip `direction = +1`
5. Cleanup: `cancelAnimationFrame`

### Effect 3 — Parallax Mouse Tracking (GSAP)

```typescript
const strength = 20;
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;

const onMouseMove = (e: MouseEvent) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  targetX = ((e.clientX - cx) / cx) * strength;
  targetY = ((e.clientY - cy) / cy) * strength;
};

const animate = () => {
  currentX += (targetX - currentX) * 0.06;
  currentY += (targetY - currentY) * 0.06;
  if (videoBgRef.current) {
    gsap.set(videoBgRef.current, { x: currentX, y: currentY });
  }
  requestAnimationFrame(animate);
};
```

---

## JSX Structure

### Root Container
```jsx
<div className="min-h-screen bg-black text-white font-body overflow-x-hidden">
```

### 1. Video Background Layer
Fixed div at `top-0 left-0`, full screen, `scale-[1.08]`:
```jsx
<div ref={videoBgRef} className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center">
  <video
    ref={videoRef}
    src={VIDEO_SRC}
    muted
    playsInline
    preload="auto"
    crossOrigin="anonymous"
    className="w-full h-full object-cover"
    style={{ display: framesReady ? 'none' : 'block' }}
  />
  <canvas
    ref={displayCanvasRef}
    className="w-full h-full object-cover"
    style={{ display: framesReady ? 'block' : 'none' }}
  />
</div>
```

### 2. Hero Title
Fixed div, centered, with fade-in animation:
```jsx
<div
  className="fixed left-0 right-0 z-20 w-full px-4 transition-all duration-1000"
  style={{
    top: '120px',
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(24px)',
  }}
>
  <h1 className="hero-title select-none">Create Unforgettable Events</h1>
</div>
```

### 3. Navigation Bar
Fixed, top center (`z-50`), liquid-glass pill:
```jsx
<nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
  <div className="liquid-glass flex items-center gap-6 rounded px-4 py-2.5">
    <LogoMark />
    <div className="flex items-center gap-5">
      {NAV_LINKS.map((link) => (
        <a
          key={link}
          href={`#${link.toLowerCase()}`}
          className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200"
        >
          {link}
        </a>
      ))}
    </div>
    <div className="flex items-center gap-3 ml-4">
      <a href="#signin" className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200">
        Sign in
      </a>
      <button className="liquid-glass-strong text-sm font-body font-medium text-white rounded px-4 py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97]">
        Book a Demo
      </button>
    </div>
  </div>
</nav>
```

### 4. Bottom Row
Fixed, bottom-12, spread layout with fade-in:
```jsx
<div
  className="fixed bottom-12 left-0 right-0 px-10 flex items-end justify-between z-20 transition-all duration-1000"
  style={{
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(24px)',
  }}
>
  {/* Left Text */}
  <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed">
    From intimate gatherings to grand celebrations, we bring your vision to life with expert planning and flawless execution.
  </p>

  {/* Center Buttons */}
  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center gap-3">
    <button className="group relative bg-white text-black text-sm font-body font-medium rounded px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03]">
      <span className="relative z-10">Start Planning</span>
      <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
    <button className="liquid-glass group text-white text-sm font-body font-medium rounded px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)]">
      View Gallery
    </button>
  </div>

  {/* Right Text */}
  <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed text-right">
    Our award-winning team handles every detail so you can focus on enjoying your special moment with loved ones.
  </p>
</div>
```

---

## Key Notes

- **Tailwind border-radius override**: Default `borderRadius` is set to `9999px`, so every `rounded` class produces pill-shaped corners
- **Video capture**: Uses `requestVideoFrameCallback()` with `requestAnimationFrame()` fallback for smooth frame capture
- **Boomerang effect**: Frames are captured and played back forward then backward, not by manipulating `video.currentTime`
- **Parallax**: Mouse movement smoothly animates the background via GSAP with a easing factor of `0.06`
- **Responsive**: Hero title scales fluidly from `72px` to `240px` using `clamp()`
- **Animations**: Fade-in on mount (controlled by `mounted` state), smooth transitions throughout

---

## EventPro Branding

- **Primary color**: Gold (`#D4AF37`) — used sparingly in CTAs and highlights
- **Background**: Pure black (`#000`) with dark overlay on video
- **Typography**: Elegant serif headings (Playfair Display) with clean sans-serif body (Inter)
- **Mood**: Premium, professional, celebration-focused
