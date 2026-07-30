// 客户端渲染 mermaid 流程图。默认布局(dagre)+ basis 顺滑曲线;从 CDN 以 ESM 加载 mermaid@11。
// 配色/字体取自站点 CSS 变量,随主题实时重渲染;按方向套间距;渲染后 SVG 响应式。
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const nodes = [...document.querySelectorAll("pre.mermaid")];
if (nodes.length) {
  for (const n of nodes) n.dataset.src = n.textContent; // 存源码供重渲染

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
  const isVertical = (src) => /^\s*(?:flowchart|graph)\s+(?:TD|TB)\b/i.test(src.trim());
  const isDark = () => {
    const dt = document.documentElement.getAttribute("data-theme");
    if (dt === "dark") return true;
    if (dt === "light") return false;
    return matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const config = (vertical) => ({
    startOnLoad: false,
    securityLevel: "strict",
    fontFamily: cssVar("--font-body") || "serif",
    theme: "base",
    look: "handDrawn", // v11 手绘风(Excalidraw 感);可换 "neo" / "classic"
    flowchart: {
      curve: "basis",
      nodeSpacing: vertical ? 45 : 62,
      rankSpacing: vertical ? 52 : 84,
      padding: 18,
      useMaxWidth: true,
    },
    themeVariables: {
      background: "transparent",
      primaryColor: cssVar("--card"),
      primaryBorderColor: cssVar("--accent"),
      primaryTextColor: cssVar("--fg"),
      lineColor: cssVar("--muted"),
      textColor: cssVar("--fg"),
      edgeLabelBackground: cssVar("--bg"),
      fontSize: "16px",
    },
  });

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
      const vertical = isVertical(n.dataset.src);
      n.textContent = withClassDefs(n.dataset.src);
      n.removeAttribute("data-processed");
      try {
        mermaid.initialize(config(vertical));
        await mermaid.run({ nodes: [n] });
      } catch (e) {
        /* 渲染失败:保留源码文本,不炸页面 */
      }
      const s = n.querySelector("svg");
      if (s) {
        s.style.maxWidth = "100%";
        s.style.height = "auto";
      }
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
}
