/**
 * Firebase 配置 - 请替换为你在 Firebase Console 创建的项目配置
 * 获取方式：Firebase Console -> 项目设置 -> 常规 -> 你的应用 -> 配置
 */

const firebaseConfig = {
  apiKey: "AIzaSyBY_vvdahMr1Oc29ydVgMvIm82uIXuFLUI",
  authDomain: "ymblog-45889.firebaseapp.com",
  projectId: "ymblog-45889",
  storageBucket: "ymblog-45889.firebasestorage.app",
  messagingSenderId: "1025852835042",
  appId: "1:1025852835042:web:1ea0dcb841316c0e934abb",
  measurementId: "G-8LHQ918VCP"
};

// 供博客/管理页使用（页面中检查的是 FIREBASE_CONFIG）
var FIREBASE_CONFIG = firebaseConfig;

/**
 * Firestore 安全规则建议（在 Firebase Console -> Firestore -> 规则 中设置）：
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /posts/{postId} {
 *       // 所有人可读已发布的文章；登录用户可读全部（便于管理）
 *       allow read: if resource.data.published == true || request.auth != null;
 *       // 仅登录用户可写（管理员）
 *       allow create, update, delete: if request.auth != null;
 *     }
 *   }
 * }
 *
 * 若希望仅特定邮箱为管理员，可改为：
 * allow create, update, delete: if request.auth != null && request.auth.token.email == "你的管理员邮箱";
 */
