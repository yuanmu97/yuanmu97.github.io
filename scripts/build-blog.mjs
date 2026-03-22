/**
 * 从 blog/posts/*.md 生成静态 blog/index.html 与 blog/post/{id}.html
 * 运行：npm run build
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import katex from "katex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "blog", "posts");
const OUT_POST_DIR = path.join(ROOT, "blog", "post");
const KATEX_SRC = path.join(ROOT, "node_modules", "katex", "dist");
const KATEX_DEST = path.join(ROOT, "stylesheets", "katex");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMathToken(block) {
  const s = block.trim();
  if (s.startsWith("$$") && s.endsWith("$$") && s.length > 4) {
    const inner = s.slice(2, -2).trim();
    return katex.renderToString(inner, {
      displayMode: true,
      throwOnError: false,
    });
  }
  if (s.startsWith("\\[") && s.endsWith("\\]")) {
    const inner = s.slice(2, -2).trim();
    return katex.renderToString(inner, {
      displayMode: true,
      throwOnError: false,
    });
  }
  if (s.startsWith("\\(") && s.endsWith("\\)")) {
    const inner = s.slice(2, -2).trim();
    return katex.renderToString(inner, {
      displayMode: false,
      throwOnError: false,
    });
  }
  if (s.startsWith("$") && s.endsWith("$") && !s.startsWith("$$")) {
    const inner = s.slice(1, -1).trim();
    return katex.renderToString(inner, {
      displayMode: false,
      throwOnError: false,
    });
  }
  return escapeHtml(block);
}

function markdownToHtml(rawContent) {
  const mathBlocks = [];
  function protect(m) {
    mathBlocks.push(m);
    return "\x02MATH" + (mathBlocks.length - 1) + "\x03";
  }
  const protected_ = rawContent
    .replace(/\$\$([\s\S]*?)\$\$/g, protect)
    .replace(/\\\[([\s\S]*?)\\\]/g, protect)
    .replace(/\\\([\s\S]*?\\\)/g, protect)
    .replace(/\$[^\$\n]+?\$/g, protect);
  let html = marked.parse(protected_, { gfm: true, async: false });
  html = html.replace(/\x02MATH(\d+)\x03/g, (_, i) =>
    renderMathToken(mathBlocks[+i])
  );
  return html;
}

function syncKatexAssets() {
  fs.mkdirSync(KATEX_DEST, { recursive: true });
  fs.copyFileSync(
    path.join(KATEX_SRC, "katex.min.css"),
    path.join(KATEX_DEST, "katex.min.css")
  );
  const fontsSrc = path.join(KATEX_SRC, "fonts");
  const fontsDest = path.join(KATEX_DEST, "fonts");
  if (!fs.existsSync(fontsSrc)) return;
  fs.mkdirSync(fontsDest, { recursive: true });
  for (const name of fs.readdirSync(fontsSrc)) {
    fs.copyFileSync(
      path.join(fontsSrc, name),
      path.join(fontsDest, name)
    );
  }
}

function loadAllPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = [];
  for (const file of files) {
    const id = path.basename(file, ".md");
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const date =
      data.date instanceof Date
        ? data.date
        : new Date(data.date || Date.now());
    posts.push({
      id: data.id || id,
      title: data.title || "无标题",
      date,
      dateIso: date.toISOString(),
      draft: data.draft === true,
      body: content.trim(),
    });
  }
  posts.sort((a, b) => b.date - a.date);
  return posts;
}

function postPageHtml({ title, date, contentHtml }) {
  const dateStr = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${escapeHtml(title)} - Mu Yuan Blog</title>
    <link rel="stylesheet" href="../../stylesheets/styles.css">
    <link rel="stylesheet" href="../../stylesheets/blog.css">
    <link rel="stylesheet" href="../../stylesheets/katex/katex.min.css">
    <link rel="icon" href="../../imgs/favicon.png">
  </head>
  <body class="blog-page">
    <div class="wrapper">
      <header>
        <h1><a href="../../index.html">Mu Yuan (袁牧)</a></h1>
        <p><a href="../index.html">Blog</a></p>
      </header>
      <section>
        <a href="../index.html" class="back-link">← 返回博客列表</a>
        <article id="postArticle">
          <h2>${escapeHtml(title)}</h2>
          <p class="post-meta">${escapeHtml(dateStr)}</p>
          <div class="post-content">${contentHtml}</div>
        </article>
      </section>
      <footer>
        <p><small><a href="../../index.html">← 返回首页</a></small></p>
      </footer>
    </div>
  </body>
</html>
`;
}

function indexHtml(items) {
  const listItems = items
    .map(
      (p) => `          <li class="post-item">
            <a href="post/${encodeURIComponent(p.id)}.html"><h3>${escapeHtml(p.title)}</h3></a>
            <p class="post-meta">${escapeHtml(
              p.date.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            )}</p>
          </li>`
    )
    .join("\n");

  const emptyNote =
    items.length === 0
      ? `        <p style="color:#777;">暂无文章。在 <code>blog/posts/</code> 下添加 <code>.md</code> 后运行 <code>npm run build</code>。</p>`
      : "";

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Blog - Mu Yuan</title>
    <link rel="stylesheet" href="../stylesheets/styles.css">
    <link rel="stylesheet" href="../stylesheets/blog.css">
    <link rel="icon" href="../imgs/favicon.png">
  </head>
  <body class="blog-page">
    <div class="wrapper">
      <header>
        <h1><a href="../index.html">Mu Yuan (袁牧)</a></h1>
        <p><a href="index.html">Blog</a></p>
      </header>
      <section>
        <h2>博客</h2>
        <ul class="post-list">
${listItems}
        </ul>
${emptyNote}
      </section>
      <footer>
        <p><small><a href="../index.html">← 返回首页</a></small></p>
      </footer>
    </div>
  </body>
</html>
`;
}

function main() {
  syncKatexAssets();
  fs.mkdirSync(OUT_POST_DIR, { recursive: true });

  const all = loadAllPosts();
  const listed = all.filter((p) => !p.draft);

  for (const p of all) {
    if (p.draft) continue;
    const html = postPageHtml({
      title: p.title,
      date: p.date,
      contentHtml: markdownToHtml(p.body),
    });
    fs.writeFileSync(path.join(OUT_POST_DIR, `${p.id}.html`), html, "utf8");
  }

  fs.writeFileSync(
    path.join(ROOT, "blog", "index.html"),
    indexHtml(listed),
    "utf8"
  );

  console.log(
    `blog: 已生成 index.html，${listed.length} 篇文章在 blog/post/*.html（KaTeX 资源已同步到 stylesheets/katex/）`
  );
}

main();
