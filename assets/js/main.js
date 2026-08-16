/* ============================================================
   无人机由你定义 · 项目官网
   交互脚本：导航、滚动显现、数字动画、锚点高亮、
             前端表单（申请定制 / 会员注册 / 在线留言）
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. 导航：滚动状态 + 移动端菜单 ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var backTop = document.getElementById("backTop");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function onScrollNav() {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 10);
    backTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
  });

  // 点击菜单项后自动收起移动端菜单
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
    });
  });

  backTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- 2. 滚动显现动画 ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- 3. 数字滚动动画 ---------- */
  var counters = document.querySelectorAll(".counter");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-target"));
    var decimals = parseInt(el.getAttribute("data-decimal") || "0", 10);
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-target"); });
  }

  /* ---------- 4. 锚点滚动高亮 ---------- */
  var sections = document.querySelectorAll("section[id]");
  var navAnchors = Array.prototype.slice.call(navLinks.querySelectorAll("a[href^='#']"));

  function highlightNav() {
    var pos = window.scrollY + 140;
    var currentId = "";
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) currentId = sec.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
    });
  }
  window.addEventListener("scroll", highlightNav, { passive: true });
  highlightNav();

  /* ---------- 5. Toast 轻提示 ---------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 3200);
  }

  /* ---------- 6. 同意勾选才可提交 ---------- */
  document.querySelectorAll("form .consent input[type='checkbox']").forEach(function (cb) {
    var form = cb.closest("form");
    var submitBtn = form ? form.querySelector("button[type='submit']") : null;
    if (!submitBtn) return;

    function updateSubmit() {
      submitBtn.disabled = !cb.checked;
    }
    cb.addEventListener("change", updateSubmit);
    form.addEventListener("reset", updateSubmit);
    updateSubmit();
  });
})();
