// 客户端渲染 mermaid 流程图,配色/字体取自站点 CSS 变量 → 与页面统一,并随主题切换实时重渲染。
// 只在含 <pre class="mermaid"> 的页面被引入(见 build.mjs)。
(() => {
  const nodes = [...document.querySelectorAll("pre.mermaid")];
  if (!nodes.length || !window.mermaid) return;

  // 保存源码,供主题切换后重渲染
  for (const n of nodes) n.dataset.src = n.textContent;

  const v = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const config = () => ({
    startOnLoad: false,
    securityLevel: "strict",
    fontFamily: v("--font-body") || "serif",
    theme: "base",
    themeVariables: {
      background: "transparent",
      primaryColor: v("--card"),
      primaryBorderColor: v("--accent"),
      primaryTextColor: v("--fg"),
      secondaryColor: v("--card"),
      tertiaryColor: v("--card"),
      lineColor: v("--muted"),
      textColor: v("--fg"),
      fontSize: "15px",
    },
  });

  let busy = false;
  async function render() {
    if (busy) return;
    busy = true;
    for (const n of nodes) {
      n.textContent = n.dataset.src; // 还原源码
      n.removeAttribute("data-processed");
    }
    window.mermaid.initialize(config());
    try {
      await window.mermaid.run({ nodes });
    } catch (e) {
      /* 渲染失败:保留源码文本,不炸页面 */
    }
    busy = false;
  }

  render();

  // 主题切换(data-theme 变化)→ 用新配色重渲染
  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  // 「跟随系统」下系统明暗切换 → 也重渲染
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((document.documentElement.getAttribute("data-theme") || "system") === "system") render();
  });
})();
