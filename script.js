/* NoteQz marketing site — light interactions, no dependencies. */
(function () {
  'use strict';

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia ? window.matchMedia('(max-width: 980px)') : { matches: false };

  // Warm the browser cache for a slide image so switching to it never shows a
  // blank / half-loaded frame. Fetches immediately (bypasses lazy deferral).
  var _pre = {};
  function preload(src) {
    if (!src || _pre[src]) return;
    _pre[src] = true;
    var i = new Image();
    i.decoding = 'async';
    i.src = src;
  }

  // year
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // sticky nav shadow
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // scroll reveal
  var reveals = document.querySelectorAll('.reveal:not(.revealed)');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('revealed');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---------- carousels ----------
     Any element with [data-carousel] cycles its .car__img children.
     Optional companions, linked by the carousel's id:
       [data-dots-for="<id>"]  — auto-built dot buttons
       [data-tabs-for="<id>"]  — existing buttons synced to slides   */
  function initCarousel(root) {
    var slides = root.querySelectorAll('.car__img');
    if (slides.length < 2) return;
    slides.forEach(function (s) { preload(s.getAttribute('src')); });
    var id = root.id || '';
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 3200;
    var dotsBox = id ? document.querySelector('[data-dots-for="' + id + '"]') : null;
    var tabsBox = id ? document.querySelector('[data-tabs-for="' + id + '"]') : null;
    var tabs = tabsBox ? tabsBox.querySelectorAll('button') : [];
    var dots = [];
    var idx = 0;
    var timer = null;

    if (dotsBox) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show screenshot ' + (i + 1));
        if (i === 0) b.classList.add('active');
        b.addEventListener('click', function () { go(i); restart(); });
        dotsBox.appendChild(b);
        dots.push(b);
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { go(i); restart(); });
    });

    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('active', k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle('active', k === idx); });
      tabs.forEach(function (t, k) {
        t.classList.toggle('active', k === idx);
        t.setAttribute('aria-selected', k === idx ? 'true' : 'false');
      });
    }
    function tick() { go(idx + 1); }
    function start() { if (!RM && !timer) timer = setInterval(tick, interval); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    start();
  }
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  /* ---------- pricing toggle — values mirror src/constants/plans.ts ---------- */
  var PRICING = {
    yearly:  { price: '₹1499', period: '/year',  cap: 'just ₹125/month · billed yearly', badge: 'Save 17%' },
    monthly: { price: '₹150',  period: '/month', cap: 'cancel anytime',                  badge: '' }
  };
  var priceEl  = document.getElementById('planPrice');
  var periodEl = document.getElementById('planPeriod');
  var capEl    = document.getElementById('planCap');
  var badgeEl  = document.getElementById('planBadge');
  var cycleBtns = document.querySelectorAll('.plan__toggle button');

  cycleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = PRICING[btn.getAttribute('data-cycle')];
      if (!p) return;
      cycleBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (priceEl)  priceEl.textContent  = p.price;
      if (periodEl) periodEl.textContent = p.period;
      if (capEl)    capEl.textContent    = p.cap;
      if (badgeEl) {
        badgeEl.textContent = p.badge;
        badgeEl.style.display = p.badge ? '' : 'none';
      }
    });
  });

  /* ---------- how it works: one slot, image + text swap together ---------- */
  var htw = document.getElementById('htw');
  if (htw) {
    var hNav = htw.querySelectorAll('.htw__nav button');
    var hImgs = htw.querySelectorAll('.htw__img');
    var hBg = htw.querySelector('[data-htw-bg]');
    var hNum = htw.querySelector('[data-htw-num]');
    var hTitle = htw.querySelector('[data-htw-title]');
    var hBody = htw.querySelector('[data-htw-body]');
    var hInner = htw.querySelector('.htw__inner');
    var hInt = parseInt(htw.getAttribute('data-interval'), 10) || 4600;
    var hIdx = 0, hTimer = null;
    hImgs.forEach(function (x) { preload(x.getAttribute('src')); });
    hNav.forEach(function (b) { preload(b.getAttribute('data-img')); });

    function hGo(i) {
      hIdx = (i + hNav.length) % hNav.length;
      var b = hNav[hIdx];
      hNav.forEach(function (x, k) {
        x.classList.toggle('active', k === hIdx);
        x.setAttribute('aria-selected', k === hIdx ? 'true' : 'false');
      });
      hImgs.forEach(function (x, k) { x.classList.toggle('active', k === hIdx); });
      if (hBg) hBg.style.backgroundImage = 'url("' + b.getAttribute('data-img') + '")';
      if (hNum) hNum.textContent = b.getAttribute('data-num');
      if (hTitle) hTitle.textContent = b.getAttribute('data-title');
      if (hBody) hBody.textContent = b.getAttribute('data-body');
      if (hInner && !RM) { hInner.classList.remove('swap'); void hInner.offsetWidth; hInner.classList.add('swap'); }
    }
    hNav.forEach(function (b, i) { b.addEventListener('click', function () { hGo(i); hRestart(); }); });
    function hTick() { hGo(hIdx + 1); }
    function hStart() { if (!RM && !hTimer) hTimer = setInterval(hTick, hInt); }
    function hStop() { clearInterval(hTimer); hTimer = null; }
    function hRestart() { hStop(); hStart(); }
    htw.addEventListener('mouseenter', hStop);
    htw.addEventListener('mouseleave', hStart);
    document.addEventListener('visibilitychange', function () { document.hidden ? hStop() : hStart(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.isIntersecting ? hStart() : hStop(); });
      }, { threshold: 0.2 }).observe(htw);
    } else { hStart(); }
    hGo(0);
  }

  /* ---------- practice modes: tap a card to reveal its detail ---------- */
  document.querySelectorAll('.mode').forEach(function (m) {
    m.addEventListener('click', function () {
      var open = m.getAttribute('aria-expanded') === 'true';
      m.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  /* ---------- mini tour: desktop popup / mobile scroll-to-hero ---------- */
  var demo = document.getElementById('demo');
  var opener = document.getElementById('demoOpen');
  if (demo && opener) {
    var screen = document.getElementById('demoScreen');
    var gate = document.getElementById('demoGate');
    var tabBtns = document.getElementById('demoTabs').querySelectorAll('button');
    var shots = screen.querySelectorAll('.car__img');
    var presses = 0;
    var lastFocus = null;

    function show(i) {
      shots.forEach(function (s, k) { s.classList.toggle('active', k === i); });
      tabBtns.forEach(function (t, k) { t.classList.toggle('active', k === i); });
    }
    function press(i) {
      if (gate.classList.contains('show')) return;
      presses++;
      if (presses > 2) {            // 2 free taps — the 3rd meets the gate
        gate.classList.add('show');
        return;
      }
      if (typeof i === 'number') show(i);
    }
    tabBtns.forEach(function (t, i) {
      t.addEventListener('click', function (e) { e.stopPropagation(); press(i); });
    });
    screen.addEventListener('click', function () { press(); });

    function openDemo() {
      lastFocus = document.activeElement;
      presses = 0;
      gate.classList.remove('show');
      show(0);
      demo.hidden = false;
      document.body.classList.add('demo-open');
      var closeBtn = demo.querySelector('.demo__close');
      if (closeBtn) closeBtn.focus();
    }
    function closeDemo() {
      demo.hidden = true;
      document.body.classList.remove('demo-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    opener.addEventListener('click', function (e) {
      e.preventDefault();
      if (MOBILE.matches) {
        // on phones the hero device IS the tour — take them to it
        var phone = document.getElementById('heroPhone');
        var bar = document.getElementById('heroTabbar');
        if (phone) phone.scrollIntoView(RM ? {} : { behavior: 'smooth', block: 'center' });
        if (bar && !RM) {
          bar.classList.remove('attn');
          void bar.offsetWidth;
          bar.classList.add('attn');
        }
        return;
      }
      openDemo();
    });
    demo.querySelectorAll('[data-demo-close]').forEach(function (el) {
      el.addEventListener('click', closeDemo);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !demo.hidden) closeDemo();
    });
    var install = document.getElementById('demoInstall');
    if (install) {
      install.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeDemo();
        var get = document.getElementById('get');
        if (get) get.scrollIntoView(RM ? {} : { behavior: 'smooth' });
      });
    }
  }
})();
