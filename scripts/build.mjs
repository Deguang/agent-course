// 预渲染构建:把 chapters/NN/README.md + 根 README.md 渲染成静态 HTML 页(每章一个真实路径 /NN/)。
// 单一真源仍是各 README;此脚本在构建期(本地或 CI)把它们渲染进模板。改 README → 重跑此脚本 → 页面自动同步。
//   用法:node scripts/build.mjs   输出到 dist/
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";

const SITE = "https://app.lideguang.com/agent-course"; // 部署基址(自定义域子路径)
const REPO = "https://github.com/Deguang/agent-course";
const OUT = "dist";
const DESC =
  "provider 中立、TypeScript、习得导向的两周 Agent 工程课。沿 raw→harness→loop→graph 演进，12 章从零手写 Agent Loop、工具集、RAG、Guardrails、Evals 到上生产 LLMOps。";

// 导航元数据(不是内容;内容全在 README)
const CH = [
  { n: "00", group: "定向", title: "基础全景:模型、工具、循环", stage: "全景 raw→graph" },
  {
    n: "01",
    group: "主线 · loop",
    title: "agent 的心脏:一个 loop",
    stage: "loop 诞生",
    file: "agent.ts",
    tests: 5,
  },
  {
    n: "02",
    group: "主线 · loop",
    title: "接真实模型 & 可靠输出",
    stage: "raw → harness",
    file: "adapter.ts",
    tests: 9,
  },
  {
    n: "03",
    group: "给 loop 长手脚",
    title: "常用工具集",
    stage: "loop + 真实工具",
    file: "tools.ts",
    tests: 12,
  },
  {
    n: "04",
    group: "给 loop 长手脚",
    title: "有状态 & 持久化",
    stage: "loop 长期运行",
    file: "session.ts",
    tests: 8,
  },
  {
    n: "05",
    group: "给 loop 长手脚",
    title: "上下文管理",
    stage: "喂得进窗口",
    file: "context.ts",
    tests: 5,
  },
  {
    n: "06",
    group: "给 loop 长手脚",
    title: "可扩展性:MCP · Skills",
    stage: "能力可插拔",
    file: "extensions.ts",
    tests: 4,
  },
  {
    n: "07",
    group: "主线 · graph",
    title: "编排与多 agent",
    stage: "loop → graph",
    file: "graph.ts",
    tests: 8,
  },
  {
    n: "08",
    group: "补齐主流栈",
    title: "知识层:RAG / 检索",
    stage: "知识层",
    file: "rag.ts",
    tests: 6,
  },
  {
    n: "09",
    group: "补齐主流栈",
    title: "Guardrails & 人在环路",
    stage: "治理竖轨",
    file: "guardrails.ts",
    tests: 8,
  },
  {
    n: "10",
    group: "补齐主流栈",
    title: "Evals & 可观测",
    stage: "观测竖轨",
    file: "eval.ts",
    tests: 6,
  },
  {
    n: "11",
    group: "补齐主流栈",
    title: "上生产:LLMOps & 服务化",
    stage: "部署层",
    file: "prod.ts",
    tests: 8,
  },
  { n: "12", group: "综合", title: "Capstone:独立做产品", stage: "综合 · 全栈" },
];

marked.setOptions({ gfm: true, breaks: false });
// 构建期代码高亮(highlight.js);颜色由 CSS 变量随主题切换，运行时零 JS。
marked.use(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// README 相对链接是相对文件在仓库的位置写的;渲染到别处会解析错 → 改指向 GitHub 仓库文件。
function resolvePath(baseDir, href) {
  const out = [];
  for (const part of (baseDir + href).split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}
// baseDir:该 README 在仓库里的目录(解析相对路径用);pageBase:当前页到站点根的前缀("" 或 "../")。
function rewriteLinks(html, baseDir, pageBase) {
  return html.replace(/href="([^"]*)"/g, (m, raw) => {
    if (raw.startsWith("#")) return m; // 页内锚点保留
    if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(raw) || /^mailto:/i.test(raw))
      return `href="${raw}" target="_blank" rel="noopener"`;
    const cut = raw.search(/[#?]/);
    const path = cut === -1 ? raw : raw.slice(0, cut);
    const tail = cut === -1 ? "" : raw.slice(cut);
    const resolved = resolvePath(baseDir, path);
    // 指向某章 README(或章目录)→ 站内页 /NN/，而不是跳去 GitHub
    const chap = resolved.match(/^chapters\/(\d\d)(?:\/README\.md)?$/);
    if (chap) return `href="${pageBase}${chap[1]}/${tail}"`;
    const isFile = /\.[a-z0-9]+$/i.test(resolved.split("/").pop() || "");
    return `href="${REPO}/${isFile ? "blob" : "tree"}/main/${resolved}${tail}" target="_blank" rel="noopener"`;
  });
}

// ```mermaid 代码块(被 highlight 当 plaintext 包成 code)→ 还原成 <pre class="mermaid">,交客户端渲染。
function extractMermaid(html) {
  let has = false;
  const out = html.replace(
    /<pre><code class="hljs language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_m, src) => {
      has = true;
      return `<pre class="mermaid">${src}</pre>`;
    },
  );
  return { html: out, has };
}

// 从 README 首段抽纯文本描述(去 markdown 记号，截断)
function extractDesc(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (/^#{1,6}\s/.test(lines[i] || "")) i++;
  while (i < lines.length && !lines[i].trim()) i++;
  const buf = [];
  while (i < lines.length && lines[i].trim()) {
    buf.push(lines[i]);
    i++;
  }
  let s = buf
    .join(" ")
    .replace(/^>\s?/, "")
    .replace(/^\s*目标[:：]\s*/, "")
    .replace(/\s*>\s*/g, " ");
  s = s
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > 150 ? `${s.slice(0, 147)}…` : s;
}

// 底部动作区:单按钮循环切换主题(图标随当前态显示) + GitHub 入口
const ACTIONS = `
    <div class="actions">
      <button id="theme-toggle" class="icon-btn" type="button" aria-label="切换主题" title="切换主题(亮/暗/跟随系统)">
        <svg class="i-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="i-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
        <svg class="i-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      </button>
      <a class="icon-btn gh" href="${REPO}" target="_blank" rel="noopener" aria-label="GitHub 仓库" title="GitHub 仓库"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>
    </div>`;

function navList(base, active) {
  const seen = [];
  let out = "";
  for (const c of CH) {
    if (!seen.includes(c.group)) {
      seen.push(c.group);
      out += `<div class="group">${c.group}</div>`;
    }
    const cls = c.n === active ? ' class="active"' : "";
    out += `<a href="${base}${c.n}/"${cls}><span class="n">${c.n}</span>${c.title}</a>`;
  }
  return out;
}

// 一个完整页面
function page({ base, active, title, desc, canonical, jsonld, contentHTML, hasMermaid }) {
  const A = `${base}assets`;
  const home = base || "./";
  const mermaidScripts = hasMermaid
    ? `\n<script src="${A}/mermaid.min.js" defer></script>\n<script src="${A}/mermaid-init.js" defer></script>`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="author" content="Deguang" />
<link rel="canonical" href="${canonical}" />
<meta name="theme-color" content="#faf9f6" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#16181c" media="(prefers-color-scheme: dark)" />
<link rel="icon" href="${A}/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${A}/favicon.svg" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="动手学 Agent" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/assets/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="zh_CN" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${SITE}/assets/og.png" />
<script type="application/ld+json">
${JSON.stringify(jsonld)}
</script>
<script>try { document.documentElement.setAttribute("data-theme", localStorage.getItem("ac-theme") || "system"); } catch (e) {}</script>
<style>:root{background:#faf9f6}:root[data-theme="dark"]{background:#16181c}@media(prefers-color-scheme:dark){:root[data-theme="system"]{background:#16181c}}</style>
<link rel="preconnect" href="https://gw.alipayobjects.com" crossorigin />
<link rel="stylesheet" href="${A}/jinkai.css" />
<link rel="stylesheet" href="${A}/site.css" />
</head>
<body>
<div class="wrap">
  <aside>
    <div class="brand"><a class="home" href="${home}"><h1>动手学 Agent</h1></a><div class="sub">provider 中立 · TS · 习得导向</div></div>
    <nav>${navList(base, active)}</nav>${ACTIONS}
    <div class="lic">
      <strong>许可</strong><br>
      代码 <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT</a> · 内容 <a href="${REPO}/blob/main/LICENSE-CONTENT" target="_blank" rel="noopener">CC BY-NC 4.0</a><br>
      © 2026 Deguang
    </div>
  </aside>
  <main>${contentHTML}</main>
</div>
<script src="${A}/site.js" defer></script>${mermaidScripts}
</body>
</html>
`;
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // 首页 = 根 README(课程导言)
  {
    const md = await readFile("README.md", "utf8");
    const mm = extractMermaid(rewriteLinks(marked.parse(md), "", "")); // 根 README 链接相对仓库根
    const body = mm.html;
    const contentHTML = `<div class="readme">${body}</div>
    <footer>渲染自 <a href="${REPO}/blob/main/README.md" target="_blank" rel="noopener">README.md</a>(单一真源)· <a href="${REPO}" target="_blank" rel="noopener">GitHub 仓库</a></footer>`;
    const html = page({
      base: "",
      active: "",
      canonical: `${SITE}/`,
      title: "动手学 Agent · 两周成为 Agent 专家(provider 中立 · TypeScript)",
      desc: DESC,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Course",
        name: "动手学 Agent · 两周成为 Agent 专家",
        description: DESC,
        url: `${SITE}/`,
        inLanguage: "zh-CN",
        provider: { "@type": "Person", name: "Deguang" },
        teaches: [
          "Agent Loop",
          "provider adapter",
          "工具集",
          "上下文管理",
          "MCP",
          "多 agent 编排 graph",
          "RAG 检索",
          "Guardrails",
          "Evals 可观测",
          "LLMOps",
        ],
        isAccessibleForFree: true,
        license: "https://creativecommons.org/licenses/by-nc/4.0/",
      },
      contentHTML,
      hasMermaid: mm.has,
    });
    await writeFile(`${OUT}/index.html`, html);
  }

  // 每章一页
  for (const c of CH) {
    const md = await readFile(`chapters/${c.n}/README.md`, "utf8");
    let body = marked.parse(md);
    body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/, ""); // 去 README 的 H1(与站点标题重复)
    body = rewriteLinks(body, `chapters/${c.n}/`, "../");
    const mm = extractMermaid(body);
    body = mm.html;
    const badges = [`<span class="tag">演进 · ${c.stage}</span>`];
    if (c.tests) badges.push(`<span class="tag">${c.tests} 个测试</span>`);
    if (c.file) badges.push(`动手 <code>chapters/${c.n}/${c.file}</code>`);
    const contentHTML = `<h2>Chapter ${c.n} · ${c.title}</h2>
    <p class="meta">${badges.join("")}</p>
    <div class="readme">${body}</div>
    <footer>正文渲染自 <a href="${REPO}/blob/main/chapters/${c.n}/README.md" target="_blank" rel="noopener">chapters/${c.n}/README.md</a>(单一真源)。真正的习得，是你能不看着从空白重推 <code>${c.file || "它"}</code>。</footer>`;
    const title = `Chapter ${c.n} · ${c.title} · 动手学 Agent`;
    const html = page({
      base: "../",
      active: c.n,
      canonical: `${SITE}/${c.n}/`,
      title,
      desc: extractDesc(md),
      jsonld: {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: `Chapter ${c.n} · ${c.title}`,
        url: `${SITE}/${c.n}/`,
        inLanguage: "zh-CN",
        learningResourceType: "lesson",
        isPartOf: {
          "@type": "Course",
          name: "动手学 Agent · 两周成为 Agent 专家",
          url: `${SITE}/`,
        },
        license: "https://creativecommons.org/licenses/by-nc/4.0/",
      },
      contentHTML,
      hasMermaid: mm.has,
    });
    await mkdir(`${OUT}/${c.n}`, { recursive: true });
    await writeFile(`${OUT}/${c.n}/index.html`, html);
  }

  // 静态资源
  await mkdir(`${OUT}/assets`, { recursive: true });
  for (const f of [
    "site.css",
    "site.js",
    "jinkai.css",
    "favicon.svg",
    "og.png",
    "mermaid.min.js",
    "mermaid-init.js",
  ]) {
    await cp(`assets/${f}`, `${OUT}/assets/${f}`);
  }

  // sitemap:首页 + 13 章
  const urls = [`${SITE}/`, ...CH.map((c) => `${SITE}/${c.n}/`)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>
`;
  await writeFile(`${OUT}/sitemap.xml`, sitemap);
  await writeFile(`${OUT}/.nojekyll`, "");

  console.log(`✓ 构建完成:${OUT}/ · 首页 + ${CH.length} 章 + assets + sitemap`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
