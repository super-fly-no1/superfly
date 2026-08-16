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

  /* ---------- 6. 云端同步（CloudBase 云开发） ---------- */
  var CLOUDBASE_ENV = "fly-3d-d4geg6o440edaa00c";
  var CLOUD_TYPE_MAP = { uvd_orders: "order", uvd_members: "member", uvd_messages: "message" };
  var _cloudApp = null;

  function getCloudApp() {
    if (_cloudApp) return _cloudApp;
    if (typeof cloudbase === "undefined") return null; // SDK 未加载时不报错
    _cloudApp = cloudbase.init({ env: CLOUDBASE_ENV });
    return _cloudApp;
  }

  // 将表单记录推送到云端；失败静默（本地 localStorage 兜底，数据不丢）
  function pushToCloud(type, record) {
    var app = getCloudApp();
    if (!app) return Promise.resolve(false);
    return app
      .auth({ persistence: "local" })
      .signInAnonymously()
      .then(function () {
        return app.callFunction({ name: "saveForm", data: { type: type, data: record } });
      })
      .then(function (res) {
        return !!(res && res.result && res.result.ok);
      })
      .catch(function () {
        return false;
      });
  }

  /* ---------- 7. 表单处理（本地保存 + 云端同步） ---------- */
  function saveRecord(key, record) {
    try {
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push(record);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) { /* localStorage 不可用时静默忽略 */ }
  }

  function bindForm(formId, storageKey, onSuccess) {
    var form = document.getElementById(formId);
    if (!form) return;
    var fields = form.querySelectorAll("[name]");
    var successBox = form.querySelector(".form-success");
    var resetBtn = form.querySelector(".btn-reset");

    function collect() {
      var record = { time: new Date().toLocaleString() };
      fields.forEach(function (f) {
        if (f.type === "radio") {
          if (f.checked) record[f.name] = f.value;
        } else {
          record[f.name] = f.value.trim();
        }
      });
      return record;
    }

    function resetForm() {
      form.reset();
      if (successBox) successBox.hidden = true;
      Array.prototype.forEach.call(form.querySelectorAll(".field, .form-grid, button[type='submit']"), function (el) {
        el.hidden = false;
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var record = collect();
      saveRecord(storageKey, record);
      // 云端同步（异步，失败不影响本地）
      var cloudType = CLOUD_TYPE_MAP[storageKey];
      if (cloudType) {
        pushToCloud(cloudType, record).then(function (ok) {
          if (ok) showToast("已同步保存到云端 ✓");
        });
      }
      if (onSuccess) onSuccess(record, form);
      // 显示成功态，隐藏表单主体
      if (successBox) {
        Array.prototype.forEach.call(form.querySelectorAll(".field, .form-grid, button[type='submit']"), function (el) {
          el.hidden = true;
        });
        successBox.hidden = false;
      }
      showToast(onSuccess ? "提交成功！" : "提交成功！");
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetForm();
      });
    }
  }

  /* 订单编号生成 */
  function genOrderId() {
    var d = new Date();
    var y = d.getFullYear();
    var n = Math.floor(1000 + Math.random() * 9000);
    return "UVD-" + y + "-" + n;
  }

  // 定制申请
  bindForm("orderForm", "uvd_orders", function (record, form) {
    var noEl = form.querySelector("#orderNo");
    if (noEl) noEl.textContent = genOrderId();
  });

  // 会员注册
  bindForm("memberForm", "uvd_members");

  // 在线留言
  bindForm("msgForm", "uvd_messages");

  /* ---------- 8. 会员卡片「开通」按钮联动注册表单 ---------- */
  var planButtons = document.querySelectorAll("[data-plan]");
  planButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      // 平滑滚动到会员注册表单（按钮本身在会员区块内）
      e.preventDefault();
      var plan = btn.getAttribute("data-plan");
      var radios = document.querySelectorAll('input[name="plan"]');
      radios.forEach(function (r) {
        if (r.value === plan) r.checked = true;
      });
      var card = document.querySelector("#membership .form-card");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.style.boxShadow = "0 0 0 3px rgba(34,211,238,0.35)";
        setTimeout(function () { card.style.boxShadow = ""; }, 1600);
      }
    });
  });
})();
