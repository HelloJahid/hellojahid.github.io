/* Md Jahid Hasan — portfolio behaviour.
   No dependencies, no build step. Three concerns:
   theme toggle, sticky-nav active state, live-demo tabs.

   Note what is NOT here: the scroll reveal. It is pure CSS
   (animation-timeline: view()) precisely so that no content on this page can
   ever be hidden by a JavaScript failure. Keep it that way. */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- theme ----------
     The inline script in <head> has already applied the stored theme to avoid
     a flash; this only wires up the toggle and keeps the label in sync. */

  var toggle = document.querySelector(".theme-toggle");

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncToggleLabel() {
    if (!toggle) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + next + " mode");
    toggle.setAttribute("title", "Switch to " + next + " mode");
  }

  if (toggle) {
    syncToggleLabel();
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
      syncToggleLabel();
    });
  }

  // Follow the OS if the visitor has never chosen explicitly.
  var osTheme = window.matchMedia("(prefers-color-scheme: dark)");
  var onOsChange = function () {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (e) { /* ignore */ }
    if (!stored) { root.removeAttribute("data-theme"); syncToggleLabel(); }
  };
  if (osTheme.addEventListener) osTheme.addEventListener("change", onOsChange);
  else if (osTheme.addListener) osTheme.addListener(onOsChange);

  /* ---------- sticky header shadow ---------- */

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- nav active state ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var setActive = function (id) {
      navLinks.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
      });
    };
    var navObserver = new IntersectionObserver(function (entries) {
      // Pick the entry closest to the top of the viewport that is intersecting.
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      setActive(visible[0].target.id);
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });

    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- live demo tabs ----------
     Iframes are never in the initial HTML. Each panel ships a stub with a
     visible "open full app" link, so the fallback exists whether or not
     Streamlit allows framing. The active panel loads when the band scrolls
     into view; the others load on first activation. */

  var tablist = document.querySelector("[data-tabs]");

  // Streamlit free-tier apps cold-start slowly, and a cross-origin frame that
  // refuses to render can't be feature-detected. So: show a spinner while it
  // wakes, and if `load` hasn't fired by EMBED_TIMEOUT, surface the direct link
  // instead of leaving the visitor staring at an empty rectangle.
  var EMBED_TIMEOUT = 12000;

  function loadFrame(panel) {
    if (!panel || panel.dataset.loaded === "true") return;
    var stub = panel.querySelector(".frame-stub");
    var url = panel.dataset.app;
    if (!stub || !url) return;

    panel.dataset.loaded = "true";
    stub.dataset.state = "loading";

    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = panel.dataset.appTitle || "Live application";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("allow", "clipboard-write; fullscreen");
    iframe.hidden = true;

    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      stub.dataset.state = "timeout";
    }, EMBED_TIMEOUT);

    iframe.addEventListener("load", function () {
      // Late arrivals still win: drop the timeout note, show the frame.
      settled = true;
      clearTimeout(timer);
      iframe.hidden = false;
      stub.remove();
    });

    // Sits after the stub so the stub keeps the height until the swap.
    stub.parentNode.appendChild(iframe);
  }

  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll(".tab"));
    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute("aria-controls"));
    });

    var select = function (i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
        if (panels[j]) panels[j].hidden = !on;
      });
      loadFrame(panels[i]);
      if (focus) tabs[i].focus();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select((i + d + tabs.length) % tabs.length, true);
      });
    });

    // The embed is deliberately short so it doesn't swallow the page. This gives
    // back the full height for anyone who wants to actually work the app.
    Array.prototype.forEach.call(document.querySelectorAll("[data-expand]"), function (btn) {
      btn.addEventListener("click", function () {
        var frame = btn.closest(".frame");
        if (!frame) return;
        var open = frame.classList.toggle("is-expanded");
        btn.textContent = open ? "Shrink" : "Expand";
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    // Explicit "load the demo" buttons inside each stub.
    panels.forEach(function (panel) {
      if (!panel) return;
      var btn = panel.querySelector("[data-load]");
      if (btn) btn.addEventListener("click", function () { loadFrame(panel); });
    });

    // Auto-load the visible panel once the band is actually on screen.
    var band = document.getElementById("live");
    if (band && "IntersectionObserver" in window) {
      var bandObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var open = panels.filter(function (p) { return p && !p.hidden; })[0];
          loadFrame(open);
          obs.disconnect();
        });
      }, { rootMargin: "200px 0px" });
      bandObserver.observe(band);
    }
  }

  /* Scroll reveal is pure CSS now (animation-timeline: view()). It deliberately
     lives nowhere in this file: content must never depend on JS to be visible. */

  /* ---------- footer year ---------- */

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
