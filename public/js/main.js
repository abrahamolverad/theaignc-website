/**
 * The AIgnc - Premium Interactions
 * Inspired by obys.agency / aim.obys.agency
 * Lenis smooth scroll, custom cursor, magnetic buttons,
 * text reveals, parallax, card tilt, staggered animations
 */

(function () {
  'use strict';

  // ─── Lenis Smooth Scroll ─────────────────────────────────────
  let lenis;

  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });
  }

  // ─── Custom Cursor ───────────────────────────────────────────
  const cursor = { x: 0, y: 0 };
  const cursorDot = { x: 0, y: 0 };
  const cursorCircle = { x: 0, y: 0 };
  let dotEl, circleEl;

  function initCursor() {
    // Don't show custom cursor on touch devices
    if ('ontouchstart' in window) return;

    dotEl = document.querySelector('.cursor-dot');
    circleEl = document.querySelector('.cursor-circle');
    if (!dotEl || !circleEl) return;

    document.addEventListener('mousemove', (e) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    });

    // Hover states
    const hoverTargets = document.querySelectorAll('a, button, .service-card, .pricing-card, .result-card, .problem-card, .process-step, .faq-item, input, textarea, select');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        dotEl.classList.add('cursor-hover');
        circleEl.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        dotEl.classList.remove('cursor-hover');
        circleEl.classList.remove('cursor-hover');
      });
    });

    // Text hover (expand cursor)
    const textTargets = document.querySelectorAll('h1, h2, h3, .hero-title, .section-title');
    textTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        circleEl.classList.add('cursor-text');
      });
      el.addEventListener('mouseleave', () => {
        circleEl.classList.remove('cursor-text');
      });
    });

    // Hide on leave
    document.addEventListener('mouseleave', () => {
      dotEl.style.opacity = '0';
      circleEl.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dotEl.style.opacity = '1';
      circleEl.style.opacity = '1';
    });

    animateCursor();
  }

  function animateCursor() {
    if (!dotEl || !circleEl) return;

    // Dot follows immediately
    cursorDot.x += (cursor.x - cursorDot.x) * 0.9;
    cursorDot.y += (cursor.y - cursorDot.y) * 0.9;

    // Circle follows with lag
    cursorCircle.x += (cursor.x - cursorCircle.x) * 0.15;
    cursorCircle.y += (cursor.y - cursorCircle.y) * 0.15;

    dotEl.style.transform = `translate(${cursorDot.x}px, ${cursorDot.y}px) translate(-50%, -50%)`;
    circleEl.style.transform = `translate(${cursorCircle.x}px, ${cursorCircle.y}px) translate(-50%, -50%)`;

    requestAnimationFrame(animateCursor);
  }

  // ─── Magnetic Buttons ────────────────────────────────────────
  function initMagnetic() {
    const magneticEls = document.querySelectorAll('.btn, .whatsapp-float, .theme-toggle, .footer-social a, .social-link');

    magneticEls.forEach(el => {
      el.classList.add('magnetic');

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ─── Text Split & Reveal ─────────────────────────────────────
  function initTextReveal() {
    // Split hero title into words
    const revealTexts = document.querySelectorAll('[data-reveal="words"]');
    revealTexts.forEach(el => {
      const text = el.innerHTML;
      // Preserve <br> and <span> tags
      const parts = text.split(/(<br\s*\/?>|<span[^>]*>.*?<\/span>)/gi);
      let html = '';

      parts.forEach(part => {
        if (part.match(/<br\s*\/?>/i)) {
          html += part;
        } else if (part.match(/<span/i)) {
          // Split inner text of span
          const match = part.match(/(<span[^>]*>)(.*?)(<\/span>)/i);
          if (match) {
            const words = match[2].trim().split(/\s+/);
            html += match[1];
            words.forEach((word, i) => {
              html += `<span class="reveal-word" style="transition-delay: ${i * 0.06}s"><span class="reveal-word-inner">${word}</span></span> `;
            });
            html += match[3];
          }
        } else {
          const words = part.trim().split(/\s+/).filter(w => w);
          words.forEach((word, i) => {
            html += `<span class="reveal-word" style="transition-delay: ${i * 0.06}s"><span class="reveal-word-inner">${word}</span></span> `;
          });
        }
      });

      el.innerHTML = html;
    });

    // Split chars
    const charReveals = document.querySelectorAll('[data-reveal="chars"]');
    charReveals.forEach(el => {
      const text = el.textContent;
      el.innerHTML = '';
      text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'reveal-char';
        span.style.transitionDelay = `${i * 0.03}s`;
        span.innerHTML = `<span class="reveal-char-inner">${char === ' ' ? '&nbsp;' : char}</span>`;
        el.appendChild(span);
      });
    });

    // Line reveal elements
    const lineReveals = document.querySelectorAll('[data-reveal="line"]');
    lineReveals.forEach(el => {
      el.classList.add('reveal-line');
    });

    // Fade up reveals
    const fadeReveals = document.querySelectorAll('[data-reveal="fade-up"]');
    fadeReveals.forEach(el => {
      el.classList.add('reveal-fade-up');
    });
  }

  // ─── Scroll Animations (IntersectionObserver) ────────────────
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all reveal elements
    const revealEls = document.querySelectorAll(
      '[data-reveal], [data-aos], .reveal-line, .reveal-fade-up, .service-card, .pricing-card, .result-card, .problem-card, .process-step, .faq-item, .about-card, .credential, .value-card, .case-study-card, .resource-card, .automation-example'
    );

    revealEls.forEach(el => observer.observe(el));

    // Staggered children
    const staggerContainers = document.querySelectorAll('[data-stagger]');
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          const delay = parseFloat(entry.target.dataset.stagger) || 0.1;

          Array.from(children).forEach((child, i) => {
            child.style.transitionDelay = `${i * delay}s`;
            child.classList.add('is-visible');
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    staggerContainers.forEach(el => staggerObserver.observe(el));

    // Also handle the old data-aos attributes for backward compat
    const aosElements = document.querySelectorAll('[data-aos]');
    aosElements.forEach(el => {
      if (!el.classList.contains('is-visible')) {
        el.style.transitionDelay = `${(parseInt(el.dataset.aosDelay) || 0) / 1000}s`;
      }
    });
  }

  // ─── Parallax on Scroll ──────────────────────────────────────
  function initParallax() {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (!parallaxEls.length) return;

    function updateParallax() {
      const scrollY = window.scrollY || window.pageYOffset;

      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const windowCenter = window.innerHeight / 2;
        const offset = (centerY - windowCenter) * speed;

        el.style.transform = `translateY(${offset}px)`;
      });

      requestAnimationFrame(updateParallax);
    }

    updateParallax();
  }

  // ─── Card Tilt (3D Perspective) ──────────────────────────────
  function initCardTilt() {
    const tiltCards = document.querySelectorAll('.service-card, .pricing-card, .result-card, .about-card, .hero-card');

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / centerY * -6;
        const rotateY = (x - centerX) / centerX * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s ease';
        setTimeout(() => { card.style.transition = ''; }, 500);
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });
    });
  }

  // ─── Navbar ──────────────────────────────────────────────────
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const handleScroll = () => {
      if ((window.scrollY || window.pageYOffset) > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ─── Mobile Navigation ──────────────────────────────────────
  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ─── Counter Animation ──────────────────────────────────────
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.floor(target * eased);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  // ─── Preloader ──────────────────────────────────────────────
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.add('loaded');

        // Trigger hero animations after preloader
        setTimeout(() => {
          document.querySelectorAll('.hero [data-reveal], .hero .reveal-fade-up, .hero .animate-fade-in, .hero .animate-slide-up').forEach(el => {
            el.classList.add('is-visible');
          });
        }, 200);
      }, 800);
    });
  }

  // ─── Contact Form ───────────────────────────────────────────
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalContent = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';

      const formData = {
        name: form.querySelector('#name')?.value,
        email: form.querySelector('#email')?.value,
        company: form.querySelector('#company')?.value,
        phone: form.querySelector('#phone')?.value,
        service: form.querySelector('#service')?.value,
        message: form.querySelector('#message')?.value
      };

      try {
        const response = await fetch('/api/contact/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          showNotification('Message sent successfully! We\'ll be in touch soon.', 'success');
          form.reset();
        } else {
          showNotification(data.message || 'Something went wrong', 'error');
        }
      } catch (err) {
        showNotification('Failed to send message. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
      }
    });
  }

  // ─── Smooth Reveal on Scroll Progress ───────────────────────
  function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = `${progress}%`;
    }, { passive: true });
  }

  // ─── Notification System ────────────────────────────────────
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    Object.assign(notification.style, {
      position: 'fixed',
      top: '100px',
      right: '20px',
      padding: '16px 20px',
      background: type === 'success' ? '#D1FAE5' : type === 'error' ? '#FEE2E2' : '#DBEAFE',
      color: type === 'success' ? '#065F46' : type === 'error' ? '#991B1B' : '#1E40AF',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'notifSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '400px'
    });

    document.body.appendChild(notification);

    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.animation = 'notifSlideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'notifSlideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  // ─── Hero Floating Visual ───────────────────────────────────
  function initHeroFloat() {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;

    let floatY = 0;
    let floatDirection = 1;

    function animateFloat() {
      floatY += 0.015 * floatDirection;
      if (floatY > 1 || floatY < -1) floatDirection *= -1;
      heroVisual.style.transform = `translateY(${floatY * 15}px)`;
      requestAnimationFrame(animateFloat);
    }
    animateFloat();
  }

  // ─── FAQ Accordion ──────────────────────────────────────────
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      item.addEventListener('toggle', function () {
        if (this.open) {
          // Close others
          faqItems.forEach(other => {
            if (other !== this && other.open) {
              other.open = false;
            }
          });
        }
      });
    });
  }

  // ─── Initialize Everything ──────────────────────────────────
  function init() {
    initPreloader();
    initLenis();
    initCursor();
    initNavbar();
    initMobileNav();
    initTextReveal();
    initScrollAnimations();
    initMagnetic();
    initParallax();
    initCardTilt();
    initCounters();
    initContactForm();
    initScrollProgress();
    initHeroFloat();
    initFAQ();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose utilities
  window.TheAIgnc = {
    showNotification,
    lenis: () => lenis
  };
})();
