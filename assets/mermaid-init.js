// 客户端渲染 mermaid 流程图。风格靠拢 Claude 官方图:按角色分类配色(io 珊瑚 / model 绿 / sub 紫)、
// 大留白、随主题明暗切换。配色集中在下面 PALETTE 一处,便于调。只在含 <pre class="mermaid"> 的页引入。
(() => {
  const nodes = [...document.querySelectorAll("pre.mermaid")];
  if (!nodes.length || !window.mermaid) return;

  for (const n of nodes) n.dataset.src = n.textContent; // 保存原始源码

  // 分类色板(明/暗两套)。io=输入输出/用户/结束,model=模型/LLM,sub=工具/检索/记忆/子系统。
  const PALETTE = {
    light: {
      io: "fill:#fdecea,stroke:#e06c5e,color:#c0392b",
      model: "fill:#e9f6ea,stroke:#5cae63,color:#2e7d32",
      sub: "fill:#f1eefc,stroke:#7c6fd6,color:#5b4fc4",
    },
    dark: {
      io: "fill:#3a241f,stroke:#e08a5a,color:#f0b79e",
      model: "fill:#1f2f26,stroke:#6fbf76,color:#a6d8a8",
      sub: "fill:#272443,stroke:#9d92e0,color:#c3b9f0",
    },
  };

  const cssVar = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const isDark = () => {
    const dt = document.documentElement.getAttribute("data-theme");
    if (dt === "dark") return true;
    if (dt === "light") return false;
    return matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const config = () => ({
    startOnLoad: false,
    securityLevel: "strict",
    fontFamily: cssVar("--font-body") || "serif",
    theme: "base",
    flowchart: {
      curve: "basis",
      nodeSpacing: 80,
      rankSpacing: 100,
      padding: 22,
      diagramPadding: 20,
      useMaxWidth: true,
    },
    themeVariables: {
      background: "transparent",
      primaryColor: cssVar("--card"),
      primaryBorderColor: cssVar("--accent"),
      primaryTextColor: cssVar("--fg"),
      lineColor: cssVar("--muted"),
      textColor: cssVar("--fg"),
      fontSize: "16px",
    },
  });

  // 把分类 classDef 注入到 flowchart 声明行之后(源码里只写 :::io/:::model/:::sub 标签)
  function withClassDefs(src) {
    const pal = PALETTE[isDark() ? "dark" : "light"];
    const defs = [
      `classDef io ${pal.io},stroke-width:1.5px,rx:14,ry:14`,
      `classDef model ${pal.model},stroke-width:1.5px`,
      `classDef sub ${pal.sub},stroke-width:1.5px`,
    ].join("\n");
    const nl = src.indexOf("\n");
    if (nl === -1) return src;
    return `${src.slice(0, nl)}\n${defs}${src.slice(nl)}`;
  }

  let busy = false;
  async function render() {
    if (busy) return;
    busy = true;
    for (const n of nodes) {
      n.textContent = withClassDefs(n.dataset.src);
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

  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((document.documentElement.getAttribute("data-theme") || "system") === "system") render();
  });
})();
