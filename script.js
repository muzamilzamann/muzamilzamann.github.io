(function () {
    'use strict';

    // ===== On refresh, always start at the home (top) section =====
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    var firstLoad = false;
    try { firstLoad = !sessionStorage.getItem('visited'); } catch (e) {}
    try { sessionStorage.setItem('visited', '1'); } catch (e) {}

    function startAtHome() {
        if (location.hash) {
            try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
        }
        window.scrollTo(0, 0);
    }
    if (!firstLoad) {
        startAtHome();
        window.addEventListener('load', startAtHome);
    }

    // ===== Theme toggle with persistence =====
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}
    if (stored) {
        document.documentElement.setAttribute('data-theme', stored);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            setTimeout(function () { accentRGB = getAccentRGB(); }, 50);
        });
    }

    // ===== Year =====
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ===== Scroll progress bar =====
    var progressBar = document.getElementById('scroll-progress');
    var nav = document.getElementById('site-nav');
    var scrollBtn = document.getElementById('scroll-top');

    function onScroll() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) progressBar.style.width = pct + '%';

        if (nav) {
            if (scrollTop > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        }

        if (scrollBtn) {
            if (scrollTop > 400) scrollBtn.classList.add('visible');
            else scrollBtn.classList.remove('visible');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (scrollBtn) {
        scrollBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Mobile menu =====
    var menuToggle = document.getElementById('menu-toggle');
    var navLinks = document.getElementById('primary-navigation');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('open');
        });
        navLinks.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { navLinks.classList.remove('open'); });
        });
    }

    // ===== Reveal on scroll =====
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el, i) {
        el.style.transitionDelay = (i % 6) * 0.08 + 's';
        revealObserver.observe(el);
    });

    // ===== Mouse spotlight on glass cards =====
    document.querySelectorAll('.glass-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', x + '%');
            card.style.setProperty('--my', y + '%');
        });
    });

    // ===== Active nav link =====
    var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    var sections = document.querySelectorAll('main section[id]');
    function setActiveLink(id) {
        navAnchors.forEach(function (a) {
            if (a.getAttribute('href') === '#' + id) a.classList.add('active');
            else a.classList.remove('active');
        });
    }
    if ('IntersectionObserver' in window) {
        var navObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setActiveLink(entry.target.id);
            });
        }, { threshold: 0.5 });
        sections.forEach(function (s) { navObserver.observe(s); });
    }

    // ===== Contact form =====
    var form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-submit');
            var original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Sending...';
            setTimeout(function () {
                btn.innerHTML = 'Message Sent <i class="fa-solid fa-check"></i>';
                form.reset();
                setTimeout(function () {
                    btn.disabled = false;
                    btn.innerHTML = original;
                }, 2500);
            }, 1200);
        });
    }

    // ===== Live animated particle network background =====
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: null, y: null, radius: 160 };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function getAccentRGB() {
        var styles = getComputedStyle(document.documentElement);
        var primary = styles.getPropertyValue('--primary').trim() || '#6366f1';
        var m = primary.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (m) return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
        return { r: 99, g: 102, b: 241 };
    }
    var accentRGB = getAccentRGB();

    function resizeCanvas() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function initParticles() {
        particles = [];
        var area = window.innerWidth * window.innerHeight;
        var count = Math.min(Math.floor(area / 14000), 100);
        for (var i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 1.8 + 0.6
            });
        }
    }

    function drawParticles() {
        var w = window.innerWidth, h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        var a = accentRGB;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            if (mouse.x !== null) {
                var dx = p.x - mouse.x;
                var dy = p.y - mouse.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    var force = (mouse.radius - dist) / mouse.radius;
                    p.x += (dx / dist) * force * 2;
                    p.y += (dy / dist) * force * 2;
                }
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',0.5)';
            ctx.fill();
        }

        for (var j = 0; j < particles.length; j++) {
            for (var k = j + 1; k < particles.length; k++) {
                var p1 = particles[j], p2 = particles[k];
                var ldx = p1.x - p2.x, ldy = p1.y - p2.y;
                var ld = Math.sqrt(ldx * ldx + ldy * ldy);
                if (ld < 130) {
                    var opacity = (1 - ld / 130) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = 'rgba(' + a.r + ',' + a.g + ',' + a.b + ',' + opacity + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(drawParticles);
    }

    if (!prefersReduced) {
        resizeCanvas();
        initParticles();
        drawParticles();

        window.addEventListener('resize', function () {
            resizeCanvas();
            initParticles();
            accentRGB = getAccentRGB();
        });
        window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mouseout', function () { mouse.x = null; mouse.y = null; });
        window.addEventListener('touchmove', function (e) {
            if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
        }, { passive: true });
        window.addEventListener('touchend', function () { mouse.x = null; mouse.y = null; });
    }
})();
