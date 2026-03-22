# 博客（静态 Markdown）

文章源文件在 **`blog/posts/`**，为 Markdown，顶部 YAML 头信息示例：

```yaml
---
id: "yourStableId"
title: "文章标题"
date: "2026-03-22T12:00:00.000Z"
published: true
---
```

- **`id`**：建议与文件名一致（`{id}.md`），用于生成 `blog/post/{id}.html` 与旧链接 `post.html?id={id}` 的跳转。
- **`draft: true`**：不参与列表与生成（不写 `post/*.html`），仅本地保留草稿时可使用。
- 正文支持 GitHub 风格 Markdown；数学公式规则与原先线上一致（`$$`、`$`、`\(` `\)`、`\[ \]`）。

## 目录说明（避免混淆）

| 路径 | 作用 |
|------|------|
| **`blog/posts/`** | **唯一信源**：每篇文章一个 `{id}.md`，你编辑的是这里。 |
| **`blog/post/`** | **构建产物**：`npm run build` 生成的 `{id}.html`，勿手改。 |
| `blog/posts/_export-manifest.json` | 可选：仅在你运行 `npm run export:firestore` 时写入，记录从 Firestore 拉取的时间与列表。 |

## 发布流程

**方式一（推荐）**：只改 `blog/posts/*.md` 后 `git commit` 并 `git push`。仓库已配置 GitHub Actions（`.github/workflows/rebuild-blog.yml`），会在云端执行 `npm run build` 并把 `blog/index.html`、`blog/post/`、`stylesheets/katex/` 一并提交。

**方式二**：在本地生成后再推送：

```bash
npm install
npm run build
git add blog/ stylesheets/katex/
git commit -m "blog: update posts"
git push
```

`npm run build` 会：

1. 将 KaTeX 样式与字体同步到 `stylesheets/katex/`（便于大陆访问、不依赖外网 CDN）。
2. 根据 `blog/posts/*.md` 生成 `blog/index.html` 与 `blog/post/*.html`。

## 从 Firestore 再拉取正文（可选）

若仍使用 Firebase 存了文章，可执行 `npm run export:firestore`，会把已发布文档写成 `blog/posts/{id}.md`（覆盖同名文件），并生成 `blog/posts/_export-manifest.json`。然后务必再执行 `npm run build` 并提交。
