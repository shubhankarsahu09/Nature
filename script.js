// Hero Section: Frame capture (boomerang setup)
const heroVideo = document.getElementById('heroVideo');
const displayCanvas = document.getElementById('displayCanvas');
const videoBg = document.getElementById('videoBg');

let frames = [];
let framesReady = false;
let capturing = true;
let lastTime = -1;
const MAX_WIDTH = 960;

function captureFrame() {
    if (!capturing || heroVideo.readyState < 2 || heroVideo.currentTime === lastTime) {
        return;
    }

    lastTime = heroVideo.currentTime;
    const scale = Math.min(1, MAX_WIDTH / heroVideo.videoWidth);
    const w = heroVideo.videoWidth * scale;
    const h = heroVideo.videoHeight * scale;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(heroVideo, 0, 0, w, h);
        frames.push(canvas);
    }
}

heroVideo.addEventListener('loadedmetadata', () => {
    heroVideo.play().catch(() => {});
    startFrameCapture();
});

heroVideo.addEventListener('ended', () => {
    capturing = false;
    framesReady = frames.length > 0;
    if (framesReady) {
        renderBoomerang();
    }
});

function startFrameCapture() {
    if ('requestVideoFrameCallback' in heroVideo) {
        const captureLoop = () => {
            captureFrame();
            heroVideo.requestVideoFrameCallback(captureLoop);
        };
        heroVideo.requestVideoFrameCallback(captureLoop);
    } else {
        const rafCapture = () => {
            captureFrame();
            if (capturing) {
                requestAnimationFrame(rafCapture);
            }
        };
        requestAnimationFrame(rafCapture);
    }
}

// Boomerang render
function renderBoomerang() {
    if (!framesReady || frames.length === 0) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    displayCanvas.width = frames[0].width;
    displayCanvas.height = frames[0].height;
    displayCanvas.style.display = 'block';
    heroVideo.style.display = 'none';

    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30; // 30 FPS

    const render = (now) => {
        if (now - last >= interval) {
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
        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
}

// Parallax mouse tracking
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;
const strength = 20;

document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = ((e.clientX - cx) / cx) * strength;
    targetY = ((e.clientY - cy) / cy) * strength;
});

const animateParallax = () => {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    videoBg.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(animateParallax);
};

animateParallax();

// Navigation smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll Animation with Intersection Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = '0s';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all fade-in-up elements
document.querySelectorAll('.fade-in-up').forEach(el => {
    observer.observe(el);
});

// Gallery Filtering
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
            if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                item.classList.remove('hidden');
                item.style.animation = 'none';
                setTimeout(() => {
                    item.style.animation = 'fadeInUp 0.6s ease forwards';
                }, 10);
            } else {
                item.classList.add('hidden');
            }
        });
    });
});

// Contact Form Validation & Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = contactForm.querySelector('input[type="text"]').value.trim();
        const email = contactForm.querySelector('input[type="email"]').value.trim();
        const eventType = contactForm.querySelector('select').value;
        const date = contactForm.querySelector('input[type="date"]').value;
        const message = contactForm.querySelector('textarea').value.trim();

        if (!name || !email || !eventType || !date || !message) {
            alert('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        alert(`Thank you, ${name}! We'll contact you shortly about your ${eventType} event.`);
        contactForm.reset();
    });
}

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50 && navbar) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else if (navbar) {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
    }
});

// Stagger animation delay for cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
});

document.querySelectorAll('.testimonial-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
});
