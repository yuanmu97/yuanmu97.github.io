/**
 * 从 Firestore 导出已发布文章为 Markdown（含 front matter），写入 blog/posts/（与静态站源文件合一）
 * 未登录仅能读取 published == true 的文档；会覆盖同 ID 的 .md，请先备份本地修改。
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "blog", "posts");

// 与 Firebase Console → 项目设置 → Web 应用配置一致
const firebaseConfig = {
  apiKey: "AIzaSyBY_vvdahMr1Oc29ydVgMvIm82uIXuFLUI",
  authDomain: "ymblog-45889.firebaseapp.com",
  projectId: "ymblog-45889",
  storageBucket: "ymblog-45889.firebasestorage.app",
  messagingSenderId: "1025852835042",
  appId: "1:1025852835042:web:1ea0dcb841316c0e934abb",
  measurementId: "G-8LHQ918VCP",
};

function frontMatter(obj) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else if (typeof v === "boolean" || typeof v === "number") {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const q = query(
    collection(db, "posts"),
    where("published", "==", true),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const manifest = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const createdAt =
      d.createdAt && typeof d.createdAt.toDate === "function"
        ? d.createdAt.toDate()
        : new Date(0);
    const title = d.title || "";
    const body = typeof d.content === "string" ? d.content : "";

    const fm = frontMatter({
      id: docSnap.id,
      title,
      date: createdAt.toISOString(),
      published: true,
    });

    const filename = `${docSnap.id}.md`;
    writeFileSync(join(OUT_DIR, filename), `${fm}\n\n${body}`, "utf8");

    manifest.push({
      id: docSnap.id,
      title,
      file: filename,
      date: createdAt.toISOString(),
    });
  });

  writeFileSync(
    join(OUT_DIR, "_export-manifest.json"),
    JSON.stringify({ exportedAt: new Date().toISOString(), posts: manifest }, null, 2),
    "utf8"
  );

  console.log(
    `已导出 ${manifest.length} 篇已发布文章到 ${OUT_DIR}\n` +
      manifest.map((m) => `  - ${m.title || "(无标题)"} (${m.id})`).join("\n") +
      `\n\n下一步：npm run build，再 git add / commit / push。`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
