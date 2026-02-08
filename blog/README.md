# 博客使用说明

本博客基于 **Firebase**（认证 + Firestore），在 GitHub Pages 静态托管下实现管理员登录、创建与编辑文章。

## 一、Firebase 配置

1. 打开 [Firebase Console](https://console.firebase.google.com/)，创建项目（或使用现有项目）。
2. 在项目中启用：
   - **Authentication** → 登录方式 → 启用「电子邮件/密码」。
   - **Firestore Database** → 创建数据库（可按测试模式先启动，随后改为安全规则）。
3. 在 **项目设置** → **常规** → 「你的应用」中添加 Web 应用，复制 `firebaseConfig`。
4. 打开站点根目录下的 `javascripts/firebase-config.js`，将 `YOUR_API_KEY`、`YOUR_PROJECT_ID` 等替换为你的配置。

## 二、Firestore 安全规则

在 Firestore → **规则** 中设置为（可按需限制为仅你的邮箱可写）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if resource.data.published == true || request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

## 三、Firestore 索引（未登录访问博客列表时需要）

未登录时博客列表按「已发布 + 创建时间」查询，需要建**复合索引**：

- 集合 ID：`posts`
- 字段：`published`（升序）、`createdAt`（降序）

**方式一**：未登录访问博客页若报错「需要创建 Firestore 索引」，点击页面上的 **「点此在 Firebase Console 创建索引」**，按提示创建即可。  
**方式二**：项目根目录有 `firestore.indexes.json`，若已安装 Firebase CLI，可执行：`firebase deploy --only firestore:indexes`

## 四、管理员账号

1. Firebase Console → **Authentication** → **用户** → **添加用户**。
2. 输入用于登录的邮箱和密码并保存。
3. 访问 **你的站点/admin/**，用该邮箱和密码登录即可管理博客。

## 五、页面说明

| 页面 | 说明 |
|------|------|
| `/blog/` | 博客列表（仅显示已发布文章） |
| `/blog/post.html?id=xxx` | 单篇文章（支持 Markdown 渲染） |
| `/admin/` | 管理员登录、创建/编辑/删除文章 |

正文支持 **Markdown**，保存后在前台自动渲染。
