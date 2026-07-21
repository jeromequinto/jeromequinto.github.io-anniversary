/* ==========================================================================
   Katrina ❤ Anniversary — script.js  (v5 — defensive/isolated architecture)
   ========================================================================== */

console.log("Katrina Anniversary script.js v10 loaded ✅ — if you don't see this in the console, your browser is running a CACHED/OLD copy of this file.");

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

document.addEventListener("DOMContentLoaded", () => {

  /* ====================================================================
     1. NAVIGATION — set up FIRST and in complete isolation.
        A failure anywhere else in this file (envelope, gallery, particles)
        is now caught locally and can NEVER again prevent the nav buttons
        from working, because this block doesn't depend on anything below it.
     ==================================================================== */
  try {
    window.showSection = function (id) {
      try {
        const target = document.getElementById(id);
        if (!target) { console.error(`showSection: no section with id "${id}"`); return; }

        // Set display DIRECTLY (not just via the .active class) — this is
        // the actual fix for "sections stack and I have to scroll to see
        // them": that happens only if something prevents the .section /
        // .section.active CSS rule from taking effect (stale stylesheet,
        // cache, load-order race). Inline styles always win, so this can
        // never again depend on the stylesheet loading correctly.
        document.querySelectorAll(".section").forEach(sec => {
          sec.classList.remove("active", "fade-up");
          sec.style.display = "none";
        });

        target.style.display = "block";
        target.classList.add("active");
        void target.offsetWidth; // restart the fade-up animation
        target.classList.add("fade-up");

        document.querySelectorAll("[data-section]").forEach(btn => {
          btn.classList.toggle("active-nav", btn.dataset.section === id);
        });

        // Instant jump — explicit "auto" always overrides scroll-behavior:smooth.
        window.scrollTo({ top: 0, behavior: "auto" });

        const navInner = document.getElementById("navInner");
        const hamburger = document.getElementById("hamburger");
        if (navInner) navInner.classList.remove("mobile-open");
        if (hamburger) hamburger.classList.remove("active");

        if (id === "gallery" && typeof window.__activateGalleryVisuals === "function") {
          requestAnimationFrame(() => window.__activateGalleryVisuals());
        }

        if (typeof window.__refreshRevealObserver === "function") {
          setTimeout(window.__refreshRevealObserver, 60);
        }
      } catch (err) {
        console.error("showSection error:", err);
      }
    };

    // Delegated listener — catches clicks on ANY current or future element
    // carrying data-section (header nav buttons AND the hero CTA buttons).
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-section]");
      if (trigger) window.showSection(trigger.dataset.section);
    });

    // Belt-and-suspenders: also bind directly to every button that exists
    // right now, so navigation works even in a browser/edge-case where
    // event delegation via closest() were somehow unavailable.
    document.querySelectorAll("[data-section]").forEach(btn => {
      btn.addEventListener("click", () => window.showSection(btn.dataset.section));
    });

    const hamburger = document.getElementById("hamburger");
    const navInner = document.getElementById("navInner");
    if (hamburger && navInner) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navInner.classList.toggle("mobile-open");
      });
    }

    const navbar = document.getElementById("navbar");
    if (navbar) {
      window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 40);
      });
    }

    console.log("Nav wired ✅ — buttons found:", document.querySelectorAll("[data-section]").length);
  } catch (err) {
    console.error("NAVIGATION SETUP FAILED — this is the actual bug if you see this:", err);
  }

  /* ====================================================================
     2. ENVELOPE — realistic open sequence
     ==================================================================== */
  try {
    const envelope = document.getElementById("envelope");
    const startScreen = document.getElementById("startScreen");
    const startContainer = document.getElementById("startContainer");
    const letterReveal = document.getElementById("letterReveal");
    const loveLetterImg = document.getElementById("loveLetterImg");
    const music = document.getElementById("music");

    function heartExplosion() {
      for (let i = 0; i < 80; i++) {
        const heart = document.createElement("div");
        heart.innerHTML = "❤️";
        heart.style.position = "fixed";
        heart.style.left = "50%";
        heart.style.top = "50%";
        heart.style.fontSize = Math.random() * 25 + 15 + "px";
        heart.style.pointerEvents = "none";
        heart.style.zIndex = "9999";
        heart.style.transition = "all 2s cubic-bezier(.17,.67,.83,.67)";
        document.body.appendChild(heart);

        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 800;

        setTimeout(() => {
          heart.style.transform = `translate(${x}px,${y}px) scale(1.5) rotate(${Math.random() * 360}deg)`;
          heart.style.opacity = "0";
        }, 10);

        setTimeout(() => heart.remove(), 2000);
      }
    }

    // Particles that burst out and sparkle along the sides of the letter.
    function spawnLetterSparkles(letterEl) {
      if (!letterEl) return;
      const rect = letterEl.getBoundingClientRect();
      if (!rect.width) return;
      const icons = ["✨", "⭐", "💫", "💖", "💗"];
      const total = 46;
      const margin = 12; // keep particles safely inside the viewport edge
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      for (let i = 0; i < total; i++) {
        const fromLeft = i % 2 === 0;
        const startX = fromLeft ? rect.left + rect.width * 0.08 : rect.right - rect.width * 0.08;
        const startY = rect.top + Math.random() * rect.height;

        const p = document.createElement("div");
        p.className = "letter-spark";
        p.textContent = icons[Math.floor(Math.random() * icons.length)];
        p.style.left = startX + "px";
        p.style.top = startY + "px";
        p.style.fontSize = (Math.random() * 12 + 10) + "px";
        p.style.opacity = "0";
        p.style.filter = "drop-shadow(0 0 6px rgba(255,230,180,.9))";
        p.style.transition = "all 1.1s cubic-bezier(.19,1,.22,1)";
        document.body.appendChild(p);

        // Cap how far each spark can travel by how much room is actually
        // left between it and the edge of the screen, so on narrow phones
        // (where the letter already sits close to the edges) sparks never
        // end up flying off-screen and invisible.
        const desired = Math.random() * 100 + 50;
        const roomToEdge = fromLeft ? (startX - margin) : (vw - startX - margin);
        const travel = Math.max(10, Math.min(desired, roomToEdge));
        const dx = (fromLeft ? -1 : 1) * travel;

        const desiredDy = (Math.random() - 0.5) * 160;
        const roomUp = startY - margin;
        const roomDown = vh - startY - margin;
        const dy = desiredDy < 0 ? Math.max(desiredDy, -roomUp) : Math.min(desiredDy, roomDown);

        requestAnimationFrame(() => {
          p.style.opacity = "1";
          p.style.transform = `translate(${dx}px, ${dy}px) scale(1.25) rotate(${Math.random() * 180 - 90}deg)`;
          setTimeout(() => (p.style.opacity = "0"), 700);
        });
        setTimeout(() => p.remove(), 1250);
      }
    }

    if (envelope && startScreen && startContainer && letterReveal) {
      let sparkleInterval = null;

      function enterSite() {
        startScreen.style.opacity = "0";
        setTimeout(() => {
          startScreen.style.display = "none";
          const navbar = document.getElementById("navbar");
          if (navbar) navbar.style.display = "block";
          window.showSection("home");
          if (music) music.play().catch(() => {});
          heartExplosion();
        }, 1000);
      }

      function proceedFromLetter() {
        if (sparkleInterval) { clearInterval(sparkleInterval); sparkleInterval = null; }
        letterReveal.classList.remove("show");
        letterReveal.classList.add("hide");
        setTimeout(() => {
          letterReveal.style.display = "none";
          enterSite();
        }, 550);
      }

      letterReveal.addEventListener("click", proceedFromLetter);

      envelope.addEventListener("click", function () {
        try {
          if (envelope.classList.contains("open")) return;

          envelope.classList.add("lift"); // Step 1: lift

          setTimeout(() => {
            envelope.classList.add("open"); // Step 2: closed → opened envelope artwork crossfade

            setTimeout(() => {
              // Step 3: hide the envelope/GIFs, reveal the love letter full-screen
              startContainer.classList.add("fade-out-hide");

              setTimeout(() => {
                startContainer.style.display = "none";
                letterReveal.style.display = "flex";
                requestAnimationFrame(() => {
                  letterReveal.classList.add("show");
                  spawnLetterSparkles(loveLetterImg);
                  sparkleInterval = setInterval(() => spawnLetterSparkles(loveLetterImg), 1100);
                });
              }, 550);
            }, 900);
          }, 400);
        } catch (err) {
          console.error("Envelope open animation error:", err);
          // Fail safe: still get the user into the site even if an
          // animation step throws, so they're never stuck on the intro.
          enterSite();
        }
      });
    } else {
      console.error("Envelope setup skipped — required elements missing from the page.");
    }
  } catch (err) {
    console.error("Envelope block error:", err);
  }

  /* ====================================================================
     3. BACKGROUND SLIDER
     ==================================================================== */
  try {
    const bg = document.querySelector(".background-slider");
    if (bg) {
      let bgIndex = 1;
      setInterval(() => {
        const imgPath = `backgroundImage/bg${bgIndex}.jpg`;
        const testImg = new Image();
        testImg.src = imgPath;
        testImg.onload = () => { bg.style.backgroundImage = `url('${imgPath}')`; };
        bgIndex++;
        if (bgIndex > 9) bgIndex = 1;
      }, 4000);
    }
  } catch (err) {
    console.error("Background slider error:", err);
  }

  /* ====================================================================
     4. GALLERY (3D carousel) + CENTER PARTICLE HEART
     ==================================================================== */
  try {
    const galleryWrapper = document.querySelector(".gallery-wrapper");
    const galleryContainer = document.getElementById("gallery-container");
    const canvas = document.getElementById("heart-canvas");

    if (galleryWrapper && galleryContainer && canvas) {
      const total = 10;
      const ctx = canvas.getContext("2d");
      let cw = 0, ch = 0, dpr;

      // ROOT CAUSE of the "fan/stacked" layout + "only fixes after DevTools"
      // bug: #gallery is display:none until active, so measuring it while
      // hidden returns 0 — that 0 used to get baked into the layout. These
      // two functions now refuse to apply a 0 measurement.
      function galleryRadius() {
        const w = galleryWrapper.getBoundingClientRect().width;
        return w ? Math.max(120, Math.min(450, w * 1.15)) : null;
      }

      for (let i = 0; i < total; i++) {
        const img = document.createElement("img");
        img.src = `CapcutPics/pic${i + 1}.jpg`;
        img.dataset.angle = (360 / total) * i;
        galleryContainer.appendChild(img);
      }

      function layoutGallery() {
        const r = galleryRadius();
        if (r === null) return false;
        galleryContainer.querySelectorAll("img").forEach(img => {
          const angle = img.dataset.angle;
          img.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${r}px)`;
        });
        return true;
      }

      function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        dpr = window.devicePixelRatio || 1;
        cw = rect.width; ch = rect.height;
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
      }

      const PARTICLE_COUNT = 140;
      const colors = ["#ff4d6d", "#ff8fa3", "#ffd6d6", "#ffffff", "#ffd700"];

      function heartPoint(t, scale) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x: x * scale, y: y * scale };
      }

      let particles = [];
      function initParticles() {
        particles = [];
        const scale = Math.min(cw, ch) / 42;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const t = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.05;
          const target = heartPoint(t, scale);
          particles.push({
            x: (Math.random() - 0.5) * cw,
            y: (Math.random() - 0.5) * ch,
            tx: target.x, ty: target.y,
            r: Math.random() * 2 + 1.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            exAngle: Math.random() * Math.PI * 2,
            exSpeed: Math.random() * 2.4 + 1.2
          });
        }
      }

      const PHASE_GATHER = 2200, PHASE_HOLD = 5000, PHASE_EXPLODE = 1100, PHASE_PAUSE = 500;
      const CYCLE = PHASE_GATHER + PHASE_HOLD + PHASE_EXPLODE + PHASE_PAUSE;
      let cycleStart = performance.now();

      function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

      function drawFrame(now) {
        requestAnimationFrame(drawFrame);
        if (!cw || !ch || !particles.length) return;

        const elapsed = (now - cycleStart) % CYCLE;
        ctx.clearRect(0, 0, cw, ch);

        const pulse = 1 + Math.sin(now / 420) * 0.035;
        const floatY = Math.sin(now / 900) * 6;

        let phase, phaseT;
        if (elapsed < PHASE_GATHER) {
          phase = "gather"; phaseT = elapsed / PHASE_GATHER;
        } else if (elapsed < PHASE_GATHER + PHASE_HOLD) {
          phase = "hold"; phaseT = (elapsed - PHASE_GATHER) / PHASE_HOLD;
        } else if (elapsed < PHASE_GATHER + PHASE_HOLD + PHASE_EXPLODE) {
          phase = "explode"; phaseT = (elapsed - PHASE_GATHER - PHASE_HOLD) / PHASE_EXPLODE;
        } else {
          phase = "pause"; phaseT = (elapsed - PHASE_GATHER - PHASE_HOLD - PHASE_EXPLODE) / PHASE_PAUSE;
          if (phaseT > 0.85) {
            particles.forEach(p => {
              p.sx = (Math.random() - 0.5) * cw;
              p.sy = (Math.random() - 0.5) * ch;
            });
          }
        }

        particles.forEach(p => {
          let px, py;
          if (phase === "gather") {
            const e = easeInOutCubic(phaseT);
            const sx = p.sx !== undefined ? p.sx : p.x;
            const sy = p.sy !== undefined ? p.sy : p.y;
            px = sx + (p.tx * pulse - sx) * e;
            py = sy + (p.ty * pulse - sy) * e + floatY * e;
          } else if (phase === "hold") {
            px = p.tx * pulse;
            py = p.ty * pulse + floatY;
          } else if (phase === "explode") {
            const e = phaseT;
            const dist = e * Math.max(cw, ch) * 0.9 * p.exSpeed / 2.4;
            px = p.tx * pulse + Math.cos(p.exAngle) * dist;
            py = p.ty * pulse + floatY + Math.sin(p.exAngle) * dist;
            p.sx = px; p.sy = py;
          } else {
            px = p.sx !== undefined ? p.sx : p.tx;
            py = p.sy !== undefined ? p.sy : p.ty;
          }

          const alpha = (phase === "explode" || phase === "pause") ? Math.max(0, 1 - phaseT) : 1;

          ctx.beginPath();
          ctx.arc(cw / 2 + px, ch / 2 + py, p.r * (phase === "hold" ? pulse : 1), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(drawFrame);

      layoutGallery();
      if (resizeCanvas()) initParticles();

      window.__activateGalleryVisuals = function () {
        const galleryOk = layoutGallery();
        const canvasOk = resizeCanvas();
        if (canvasOk) { initParticles(); cycleStart = performance.now(); }
        return galleryOk && canvasOk;
      };

      window.addEventListener("resize", debounce(() => {
        if (document.getElementById("gallery")?.classList.contains("active")) {
          window.__activateGalleryVisuals();
        }
      }, 150));

      if ("ResizeObserver" in window) {
        let lastW = 0, lastH = 0;
        const ro = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && (Math.abs(width - lastW) > 2 || Math.abs(height - lastH) > 2)) {
              lastW = width; lastH = height;
              window.__activateGalleryVisuals();
            }
          }
        });
        ro.observe(galleryWrapper);
      }
    } else {
      console.error("Gallery setup skipped — .gallery-wrapper, #gallery-container, or #heart-canvas missing.");
    }
  } catch (err) {
    console.error("Gallery block error:", err);
  }

  /* ====================================================================
     5. LIGHTBOX
     ==================================================================== */
  try {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    if (lightbox && lightboxImg) {
      window.openLightbox = function (src) {
        lightboxImg.src = src;
        lightbox.style.display = "flex";
        setTimeout(() => (lightbox.style.opacity = "1"), 10);
      };
      window.closeLightbox = function () {
        lightbox.style.opacity = "0";
        setTimeout(() => {
          lightbox.style.display = "none";
          lightboxImg.src = "";
        }, 300);
      };
    }
  } catch (err) {
    console.error("Lightbox error:", err);
  }

  /* ====================================================================
     6. AMBIENT PARTICLE FIELD — hearts, roses, sunflowers, kisses, sparkles
     ==================================================================== */
  try {
    const field = document.getElementById("particle-field");
    if (field) {
      const allEmojis = ["❤", "💗", "💕", "🌹", "🌻", "💋", "✨", "⭐"];

      function spawnAmbient() {
        const el = document.createElement("div");
        el.className = "p-item";
        el.textContent = allEmojis[Math.floor(Math.random() * allEmojis.length)];
        el.style.fontSize = (Math.random() * 16 + 14) + "px";
        el.style.left = Math.random() * 100 + "vw";
        el.style.opacity = (Math.random() * 0.5 + 0.35).toFixed(2);
        el.style.setProperty("--drift", (Math.random() - 0.5) * 120 + "px");

        if (Math.random() > 0.5) {
          el.style.bottom = "-10vh";
          el.style.animation = `floatUpGlow ${Math.random() * 8 + 10}s linear forwards`;
        } else {
          el.style.top = "-10vh";
          el.style.animation = `driftDown ${Math.random() * 8 + 9}s linear forwards`;
        }

        field.appendChild(el);
        setTimeout(() => el.remove(), 20000);
      }
      setInterval(spawnAmbient, 650);
      for (let i = 0; i < 10; i++) setTimeout(spawnAmbient, i * 200);
    }
  } catch (err) {
    console.error("Ambient particle field error:", err);
  }

  /* ====================================================================
     7. HEART BURST on click / tap anywhere in the live site
     ==================================================================== */
  try {
    const startScreen = document.getElementById("startScreen");

    function burstAt(x, y, count) {
      const icons = ["❤", "💖", "✨"];
      for (let i = 0; i < count; i++) {
        const b = document.createElement("div");
        b.className = "burst-item";
        b.textContent = icons[Math.floor(Math.random() * icons.length)];
        b.style.left = x + "px";
        b.style.top = y + "px";
        b.style.fontSize = (Math.random() * 10 + 12) + "px";
        b.style.opacity = "1";
        b.style.transition = "all .9s cubic-bezier(.2,.8,.2,1)";
        document.body.appendChild(b);
        const dx = (Math.random() - 0.5) * 90;
        const dy = -Math.random() * 90 - 20;
        requestAnimationFrame(() => {
          b.style.transform = `translate(${dx}px, ${dy}px) scale(1.3)`;
          b.style.opacity = "0";
        });
        setTimeout(() => b.remove(), 950);
      }
    }

    document.addEventListener("click", (e) => {
      if (!startScreen || getComputedStyle(startScreen).display === "none") {
        burstAt(e.clientX, e.clientY, 6);
      }
    });
  } catch (err) {
    console.error("Heart burst error:", err);
  }

  /* ====================================================================
     8. SCROLL REVEAL for cards
     ==================================================================== */
  try {
    let revealObserver;
    window.__refreshRevealObserver = function () {
      if (revealObserver) revealObserver.disconnect();
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      }, { threshold: 0.15 });
      document.querySelectorAll(".section.active .reveal").forEach(el => revealObserver.observe(el));
    };

    document.querySelectorAll(".memory-frame, .message-card, .reason-card").forEach(el => el.classList.add("reveal"));
    window.__refreshRevealObserver();
  } catch (err) {
    console.error("Scroll reveal error:", err);
  }

  /* ====================================================================
     9. CONSTELLATION STARS for Memories section
     ==================================================================== */
  try {
    const constellationLayer = document.getElementById("constellationLayer");
    if (constellationLayer) {
      const starChars = ["✦", "✧", "⋆", "✩"];
      for (let i = 0; i < 26; i++) {
        const s = document.createElement("div");
        s.className = "star-twinkle";
        s.textContent = starChars[Math.floor(Math.random() * starChars.length)];
        s.style.left = Math.random() * 100 + "%";
        s.style.top = Math.random() * 100 + "%";
        s.style.fontSize = (Math.random() * 14 + 8) + "px";
        s.style.animationDelay = (Math.random() * 4) + "s";
        s.style.animationDuration = (Math.random() * 3 + 3) + "s";
        constellationLayer.appendChild(s);
      }
      for (let i = 0; i < 3; i++) {
        const sh = document.createElement("div");
        sh.className = "shooting-star-mini";
        sh.style.left = Math.random() * 60 + "%";
        sh.style.top = Math.random() * 40 + "%";
        sh.style.animationDelay = (i * 2) + "s";
        constellationLayer.appendChild(sh);
      }
    }
  } catch (err) {
    console.error("Constellation stars error:", err);
  }

});