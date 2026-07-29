// 预渲染站点的唯一运行时脚本:主题单按钮循环切换(亮 → 暗 → 跟随系统)。
// 正文与代码高亮已在构建期生成为静态 HTML,无需 marked / fetch / 路由。
// 当前态图标由 CSS 按 data-theme 显示;data-theme 已在 <head> 提前应用避免闪屏。
const MODES = ["light", "dark", "system"];
const LABELS = { light: "亮色", dark: "暗色", system: "跟随" };

function currentMode() {
  let m = null;
  try {
    m = localStorage.getItem("ac-theme");
  } catch (e) {}
  return MODES.includes(m) ? m : "system";
}

function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem("ac-theme", mode);
  } catch (e) {}
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.title = `主题:${LABELS[mode]}(点击切换)`;
}

applyTheme(currentMode());

const toggle = document.getElementById("theme-toggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    applyTheme(MODES[(MODES.indexOf(currentMode()) + 1) % MODES.length]);
  });
}

// 移动端:汉堡按钮折叠/展开导航
const navToggle = document.querySelector(".nav-toggle");
const aside = document.querySelector("aside");
if (navToggle && aside) {
  navToggle.addEventListener("click", () => {
    const open = aside.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

// 点击放大预览:正文图片 + mermaid 流程图。支持滚轮/双指缩放、拖动平移、双击复位。
function openLightbox(node) {
  const box = document.createElement("div");
  box.className = "lightbox";
  const stage = document.createElement("div");
  stage.className = "lb-stage";
  const content = document.createElement("div");
  content.className = "lb-content";
  const clone = node.cloneNode(true);
  clone.removeAttribute("style"); // 去掉 mermaid 内联 max-width,由 CSS 接管
  if (clone.tagName && clone.tagName.toLowerCase() === "svg") {
    // 用 viewBox 尺寸补固有宽高,避免 SVG 在 lightbox 里塌成 0(白块)
    const vb = (clone.getAttribute("viewBox") || "").trim().split(/\s+/).map(Number);
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
      clone.setAttribute("width", vb[2]);
      clone.setAttribute("height", vb[3]);
    }
  }
  content.appendChild(clone);
  stage.appendChild(content);
  box.appendChild(stage);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lb-close";
  closeBtn.setAttribute("aria-label", "关闭");
  closeBtn.textContent = "×";
  box.appendChild(closeBtn);

  const hint = document.createElement("div");
  hint.className = "lb-hint";
  hint.textContent = "滚轮 / 双指缩放 · 拖动平移 · 双击复位 · Esc 关闭";
  box.appendChild(hint);
  document.body.appendChild(box);

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pinch = 0;
  let down = null;
  let moved = false;

  const apply = () => {
    content.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };
  function zoomAt(factor, cx, cy) {
    const r = content.getBoundingClientRect();
    const ns = Math.min(8, Math.max(1, scale * factor));
    if (ns === 1) {
      scale = 1;
      tx = 0;
      ty = 0;
    } else {
      const ratio = ns / scale;
      tx -= (cx - (r.left + r.width / 2)) * (ratio - 1);
      ty -= (cy - (r.top + r.height / 2)) * (ratio - 1);
      scale = ns;
    }
    apply();
  }

  function close() {
    box.remove();
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) {
    if (e.key === "Escape") close();
  }

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
    },
    { passive: false },
  );
  stage.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY };
    moved = false;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!down || pinch) return;
    if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 4) moved = true;
    if (scale > 1) {
      tx += e.clientX - down.x;
      ty += e.clientY - down.y;
      down = { x: e.clientX, y: e.clientY };
      apply();
    }
  });
  stage.addEventListener("pointerup", () => {
    const wasTap = scale === 1 && !moved;
    down = null;
    if (wasTap) close(); // 未缩放时轻点即关闭
  });
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) zoomAt(d / pinch, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      pinch = d;
    },
    { passive: false },
  );
  stage.addEventListener("touchend", () => {
    pinch = 0;
  });
  content.addEventListener("dblclick", (e) => {
    if (scale > 1) {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    } else {
      zoomAt(2.2, e.clientX, e.clientY);
    }
  });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
}
document.addEventListener("click", (e) => {
  const svg = e.target.closest(".readme pre.mermaid svg");
  const img = e.target.closest(".readme img");
  if (svg) openLightbox(svg);
  else if (img) openLightbox(img);
});
