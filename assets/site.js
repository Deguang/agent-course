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
