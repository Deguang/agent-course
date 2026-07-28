// 预渲染站点的唯一运行时脚本:主题切换(亮 / 暗 / 跟随系统)。
// 正文已在构建期生成为静态 HTML,无需 marked / fetch / 路由。data-theme 已在 <head> 提前应用避免闪屏。
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem("ac-theme", mode);
  } catch (e) {}
  document.querySelectorAll("#theme button").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
}
applyTheme(localStorage.getItem("ac-theme") || "system");
document.querySelectorAll("#theme button").forEach((b) => {
  b.addEventListener("click", () => applyTheme(b.dataset.mode));
});
