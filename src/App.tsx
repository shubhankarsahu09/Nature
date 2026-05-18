import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = ['Gallery', 'Styles', 'API', 'Pricing', 'Blog'];
const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4';

const LogoMark = () => (
  <svg width="44" height="26" viewBox="0 0 44 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="3" width="14" height="20" rx="3" fill="white"/>
    <rect x="16" y="3" width="12" height="20" rx="3" fill="white"/>
    <rect x="30" y="3" width="14" height="20" rx="3" fill="white"/>
  </svg>
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const loadingScreenRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis for smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0, 0);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Initial mount & loading simulation
  useEffect(() => {
    setMounted(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 3) + 1;
      if (prog > 85) {
        clearInterval(interval);
      } else {
        setLoadingProgress(prog);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // When frames are ready, finish loading and setup scroll animations
  useEffect(() => {
    if (framesReady && loadingScreenRef.current) {
      setLoadingProgress(100);
      
      const tl = gsap.timeline({
        onComplete: () => {
          setShowLoading(false);
          ScrollTrigger.refresh();
        }
      });
      
      tl.to(loadingScreenRef.current, {
        yPercent: -100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.inOut",
        delay: 0.4
      });

      // Setup scroll animations for sections
      const sections = gsap.utils.toArray('.animate-section');
      sections.forEach((section: any) => {
        gsap.fromTo(section, 
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // Parallax images
      gsap.utils.toArray('.parallax-image').forEach((img: any) => {
        gsap.to(img, {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });
    }
  }, [framesReady]);

  // Effect 1 - Frame capture (boomerang setup)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;
    const frames: HTMLCanvasElement[] = [];
    let handle: number;

    const captureFrame = () => {
      if (!capturing) return;
      
      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        
        const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
        const w = video.videoWidth * scale;
        const h = video.videoHeight * scale;
        
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          frames.push(canvas);
        }
      }

      if ('requestVideoFrameCallback' in video) {
        handle = (video as any).requestVideoFrameCallback(captureFrame);
      } else {
        handle = requestAnimationFrame(captureFrame);
      }
    };

    const onLoaded = () => {
      video.play().catch(() => {});
      captureFrame();
    };

    const onEnded = () => {
      capturing = false;
      framesRef.current = frames;
      setFramesReady(true);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);

    if (video.readyState >= 1) {
      onLoaded();
    }

    return () => {
      capturing = false;
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
      if ('cancelVideoFrameCallback' in video) {
        (video as any).cancelVideoFrameCallback(handle);
      } else {
        cancelAnimationFrame(handle);
      }
    };
  }, []);

  // Effect 2 - Boomerang render
  useEffect(() => {
    if (!framesReady || framesRef.current.length === 0) return;
    
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    
    const frames = framesRef.current;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30;
    let rafId: number;

    const render = (now: number) => {
      if (now - last >= interval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[index], 0, 0);
        
        index += direction;
        if (index >= frames.length - 1) {
          index = frames.length - 1;
          direction = -1;
        } else if (index <= 0) {
          index = 0;
          direction = 1;
        }
        last = now;
      }
      rafId = requestAnimationFrame(render);
    };
    
    rafId = requestAnimationFrame(render);
    
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  // Effect 3 - Parallax mouse tracking
  useEffect(() => {
    const strength = 20;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      
      if (videoBgRef.current) {
        gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      }
    };

    gsap.ticker.add(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      gsap.ticker.remove(updateParallax);
    };
  }, []);

  return (
    <>
      {showLoading && (
        <div 
          ref={loadingScreenRef}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white"
        >
          <div className="flex flex-col items-center gap-6 overflow-hidden">
             <div className="text-sm font-body font-light tracking-widest text-white/50 uppercase">
                Loading MicroVisuals
             </div>
             <div className="font-heading italic text-6xl md:text-8xl">
                {loadingProgress}%
             </div>
             <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden mt-4">
                <div 
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
             </div>
          </div>
        </div>
      )}

      <div ref={appRef} className="bg-black text-white font-body overflow-x-hidden relative selection:bg-white/20">
        
        {/* Navigation - Always on top */}
        <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
          <div className="liquid-glass flex items-center gap-6 rounded px-4 py-2.5">
            <LogoMark />
            <div className="flex items-center gap-5">
              {NAV_LINKS.map(link => (
                <a key={link} href="#" className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200">
                  {link}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-4">
              <a href="#" className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200">
                Sign in
              </a>
              <button className="liquid-glass-strong text-sm font-body font-medium text-white rounded px-4 py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97]">
                Try it free
              </button>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="relative w-full h-screen hero-container">
          {/* Background Media */}
          <div ref={videoBgRef} className="absolute top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center">
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

          {/* Hero Content */}
          <div 
            className={`absolute left-0 right-0 z-20 w-full px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ top: '126px' }}
          >
            <h1 className="hero-title select-none">MicroVisuals</h1>
          </div>

          <div className={`absolute bottom-12 left-0 right-0 px-10 flex items-end justify-between z-20 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed drop-shadow-md">
              Forma's AI understands context, composition, and style like a creative director would.
            </p>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center gap-3">
              <button className="group relative bg-white text-black text-sm font-body font-medium rounded px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03]">
                <span className="relative z-10">Start generating</span>
                <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
              <button className="liquid-glass group text-white text-sm font-body font-medium rounded px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)]">
                See templates
              </button>
            </div>

            <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed text-right drop-shadow-md">
              Describe what you see in your head — get images that actually match.
            </p>
          </div>
          
          {/* Subtle gradient overlay to blend into next section */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10"></div>
        </section>

        {/* SECTION 1: THE WILDERNESS */}
        <section className="relative w-full min-h-screen flex items-center justify-center py-32 px-4 z-10 bg-black">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="animate-section">
              <h2 className="font-heading italic text-6xl lg:text-8xl mb-8 leading-[0.9]">The<br/>Wilderness</h2>
              <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed mb-8 max-w-md">
                Step into a realm untouched by time. Our creative engine generates ethereal landscapes that breathe life into your vision, capturing the raw essence of nature with unprecedented precision and scale.
              </p>
              <button className="liquid-glass-strong px-8 py-4 rounded-full text-sm font-medium tracking-wide uppercase hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
                Explore Environments
              </button>
            </div>
            <div className="animate-section relative h-[500px] lg:h-[700px] rounded-3xl overflow-hidden liquid-glass">
              <video src="/video1.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover parallax-image scale-[1.3] opacity-80" />
            </div>
          </div>
        </section>

        {/* SECTION 2: IMMERSION / EPIC SCALE */}
        <section className="relative w-full h-[120vh] flex items-center justify-center overflow-hidden z-10 bg-black">
          <div className="absolute inset-0 z-0">
            <video src="/video2.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover parallax-image scale-[1.3] opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80"></div>
          </div>
          <div className="relative z-10 animate-section text-center max-w-4xl px-4 flex flex-col items-center">
            <h2 className="font-heading italic text-7xl md:text-9xl mb-6 tracking-tight drop-shadow-2xl">Epic Scale.</h2>
            <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed max-w-2xl drop-shadow-lg">
              From micro textures to macro vistas, every generated detail holds a story. Command the elements with absolute control.
            </p>
          </div>
        </section>

        {/* SECTION 3: DETAILS & MICRO TEXTURES */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center py-32 px-4 z-10 bg-black">
          <div className="max-w-7xl mx-auto w-full mb-24 animate-section">
            <h2 className="font-heading italic text-6xl md:text-8xl text-center leading-[0.9]">Micro<br/>Textures</h2>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden liquid-glass animate-section relative order-2 lg:order-1">
              <video src="/video3.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover parallax-image scale-[1.3] opacity-80" />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-center animate-section p-8 lg:p-12 liquid-glass rounded-3xl order-1 lg:order-2 mb-8 lg:mb-0">
              <h3 className="font-heading italic text-4xl lg:text-5xl mb-6">Precision</h3>
              <p className="text-white/70 font-light text-lg leading-relaxed mb-8">
                Notice the perfect refraction in every dewdrop. This is the power of our state-of-the-art visual engine, engineered to understand light and material exactly as nature intended.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span className="w-12 h-[1px] bg-white/20"></span> High Frequency Detail
                </div>
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span className="w-12 h-[1px] bg-white/20"></span> Accurate Caustics
                </div>
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span className="w-12 h-[1px] bg-white/20"></span> Organic Subsurface Scattering
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FOOTER */}
        <footer className="w-full py-16 border-t border-white/5 text-center text-white/40 font-light text-sm z-10 relative bg-black">
          <LogoMark />
          <p className="mt-8">&copy; 2026 MicroVisuals Inc. All rights reserved.</p>
        </footer>

      </div>
    </>
  );
}
