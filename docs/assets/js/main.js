// ===== Mobile Menu Toggle =====
function initMobileMenu() {
  const toggle = document.querySelector(".nav__toggle");
  const mobileNav = document.querySelector(".nav__mobile");
  const mobileLinks = document.querySelectorAll(".nav__mobile-link");
  const body = document.body;

  if (!toggle || !mobileNav) return;

  // Toggle menu
  toggle.addEventListener("click", () => {
    const isActive = toggle.classList.toggle("active");
    mobileNav.classList.toggle("active");
    body.style.overflow = isActive ? "hidden" : "";
  });

  // Close menu when clicking a link
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("active");
      mobileNav.classList.remove("active");
      body.style.overflow = "";
    });
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav.classList.contains("active")) {
      toggle.classList.remove("active");
      mobileNav.classList.remove("active");
      body.style.overflow = "";
    }
  });

  // Close menu on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024 && mobileNav.classList.contains("active")) {
      toggle.classList.remove("active");
      mobileNav.classList.remove("active");
      body.style.overflow = "";
    }
  });
}

// ===== Navigation Scroll Effect =====
function initNavScroll() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  let lastScroll = 0;
  const scrollThreshold = 50;

  window.addEventListener(
    "scroll",
    () => {
      const currentScroll = window.pageYOffset;

      // Add scrolled class when user scrolls down
      if (currentScroll > scrollThreshold) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }

      lastScroll = currentScroll;
    },
    { passive: true },
  );
}

// ===== Smooth Scroll for Anchor Links =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Skip if it's just "#"
      if (href === "#") return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = 80;
        const targetPosition =
          target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

// ===== Intersection Observer for Animations =====
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all cards and sections (except hero which is already animated)
  const elementsToAnimate = document.querySelectorAll(`
    .feature-card,
    .server-card,
    .step,
    .stack-card,
    .cta-card
  `);

  elementsToAnimate.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
    observer.observe(el);
  });
}

// ===== Copy Code Block Content =====
function initCodeCopy() {
  const codeBlocks = document.querySelectorAll(".code-block");

  codeBlocks.forEach((block) => {
    // Create copy button
    const button = document.createElement("button");
    button.className = "code-copy-btn";
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm0 1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1H4z"/>
        <path d="M2 6V5a2 2 0 012-2h7"/>
      </svg>
    `;
    button.title = "Copy to clipboard";

    // Position the button
    block.style.position = "relative";
    button.style.position = "absolute";
    button.style.top = "12px";
    button.style.right = "12px";
    button.style.padding = "6px";
    button.style.background = "rgba(15, 23, 42, 0.8)";
    button.style.border = "1px solid rgba(148, 163, 184, 0.2)";
    button.style.borderRadius = "6px";
    button.style.color = "#94a3b8";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.2s";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";

    button.addEventListener("mouseenter", () => {
      button.style.color = "#6366f1";
      button.style.borderColor = "#6366f1";
    });

    button.addEventListener("mouseleave", () => {
      button.style.color = "#94a3b8";
      button.style.borderColor = "rgba(148, 163, 184, 0.2)";
    });

    button.addEventListener("click", async () => {
      const code = block.textContent;

      try {
        await navigator.clipboard.writeText(code);

        // Show success feedback
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
          </svg>
        `;
        button.style.color = "#22c55e";

        setTimeout(() => {
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm0 1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1H4z"/>
              <path d="M2 6V5a2 2 0 012-2h7"/>
            </svg>
          `;
          button.style.color = "#94a3b8";
        }, 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    });

    block.appendChild(button);
  });
}

// ===== Add External Link Icons =====
function initExternalLinks() {
  const externalLinks = document.querySelectorAll(
    'a[target="_blank"]:not(.button):not(.github-link)',
  );

  externalLinks.forEach((link) => {
    // Skip if it already has an SVG
    if (link.querySelector("svg")) return;

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("width", "14");
    icon.setAttribute("height", "14");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("fill", "currentColor");
    icon.style.display = "inline-block";
    icon.style.marginLeft = "4px";
    icon.style.opacity = "0.6";
    icon.style.verticalAlign = "middle";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 3L13 3L13 13M13 3L3 13");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");

    icon.appendChild(path);
    link.appendChild(icon);
  });
}

// ===== Keyboard Navigation Enhancement =====
function initKeyboardNav() {
  // Add focus styles for keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      document.body.classList.add("keyboard-nav");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-nav");
  });

  // Add focus-visible styles
  const style = document.createElement("style");
  style.textContent = `
    body:not(.keyboard-nav) *:focus {
      outline: none;
    }
    
    .keyboard-nav *:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: 2px;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
}

// ===== Performance: Lazy Load Images =====
function initLazyLoading() {
  if ("loading" in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js";
    document.body.appendChild(script);
  }
}

// ===== Stats Counter Animation =====
function initStatsCounter() {
  const stats = document.querySelectorAll(".stat-card__value");

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateValue(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  stats.forEach((stat) => observer.observe(stat));
}

function animateValue(element) {
  const text = element.textContent;
  const hasPercent = text.includes("%");
  const hasPlus = text.includes("+");
  const value = parseFloat(text.replace(/[^0-9.]/g, ""));

  // Skip if not a number
  if (isNaN(value)) return;

  const duration = 1500;
  const steps = 60;
  const increment = value / steps;
  const stepDuration = duration / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= value) {
      current = value;
      clearInterval(timer);
    }

    let displayValue = Math.floor(current);
    if (hasPercent) displayValue += "%";
    if (hasPlus && current >= value) displayValue += "+";

    element.textContent = displayValue;
  }, stepDuration);
}

// ===== Touch Interactions for Mobile =====
function initTouchInteractions() {
  // Add touch-friendly interactions for mobile
  if ("ontouchstart" in window) {
    document.body.classList.add("touch-device");

    // Add touch ripple effect to cards
    const cards = document.querySelectorAll(
      ".feature-card, .server-card, .stack-card, .bento-item",
    );
    cards.forEach((card) => {
      card.addEventListener("touchstart", function (e) {
        this.style.transform = "scale(0.98)";
      });

      card.addEventListener("touchend", function (e) {
        this.style.transform = "";
      });
    });
  }
}

// ===== Initialize All Features =====
function init() {
  // Wait for DOM to be fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }

  try {
    initMobileMenu();
    initNavScroll();
    initSmoothScroll();
    initScrollAnimations();
    initCodeCopy();
    initExternalLinks();
    initKeyboardNav();
    initLazyLoading();
    initStatsCounter();
    initTouchInteractions();
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

// Start initialization
init();

// ===== Service Worker Registration (Optional PWA Support) =====
if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    // Uncomment to enable PWA features
    // navigator.serviceWorker.register('/sw.js')
    //   .then(reg => console.log('ServiceWorker registered'))
    //   .catch(err => console.log('ServiceWorker registration failed'));
  });
}
