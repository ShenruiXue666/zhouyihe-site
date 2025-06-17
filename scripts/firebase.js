// 导入Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// 您的Firebase配置
const firebaseConfig = {
  // 这里需要填入您的Firebase配置信息
  // 您可以从Firebase控制台获取这些信息
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 初始化Firestore和Storage
export const db = getFirestore(app);
export const storage = getStorage(app); 