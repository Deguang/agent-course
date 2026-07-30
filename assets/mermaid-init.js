// 客户端渲染 mermaid 流程图。v11 + ELK 布局(更专业的正交路由),从 CDN 以 ESM 加载。
// 配色/字体取自站点 CSS 变量,随主题实时重渲染;按方向套间距;ELK 失败自动退回默认布局(不至于全白)。

import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs";
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const nodes = [...document.querySelectorAll("pre.mermaid")];
if (nodes.length) {
  let elkOk = false;
  try {
    mermaid.registerLayoutLoaders(elkLayouts);
    elkOk = true;
  } catch (e) {}

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

  const config = (vertical, elk) => {
    const c = {
      startOnLoad: false,
      securityLevel: "strict",
      fontFamily: cssVar("--font-body") || "serif",
      theme: "base",
      flowchart: {
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
    };
    if (elk) c.layout = "elk";
    return c;
  };

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

  const responsive = (n) => {
    const s = n.querySelector("svg");
    if (s) {
      s.style.maxWidth = "100%";
      s.style.height = "auto";
    }
  };
  const reset = (n) => {
    n.textContent = withClassDefs(n.dataset.src);
    n.removeAttribute("data-processed");
  };

  let busy = false;
  async function render() {
    if (busy) return;
    busy = true;
    for (const n of nodes) reset(n);
    for (const n of nodes) {
      const vertical = isVertical(n.dataset.src);
      try {
        mermaid.initialize(config(vertical, elkOk));
        await mermaid.run({ nodes: [n] });
      } catch (e) {
        // ELK 或本图渲染失败 → 退回默认布局,别让图变空
        try {
          reset(n);
          mermaid.initialize(config(vertical, false));
          await mermaid.run({ nodes: [n] });
        } catch (e2) {}
      }
      responsive(n);
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
