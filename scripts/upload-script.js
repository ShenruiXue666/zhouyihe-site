import { db, storage } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

console.log("脚本已加载");

const uploadBtn = document.getElementById("uploadBtn");
console.log("上传按钮元素:", uploadBtn);

document.getElementById("imageInput").addEventListener("change", (e) => {
  const fileName = e.target.files[0]?.name || "未选择任何文件";
  document.getElementById("fileName").textContent = fileName;
  console.log("文件已选择:", fileName);
});

uploadBtn.addEventListener("click", async () => {
  console.log("上传按钮被点击");
  const file = document.getElementById("imageInput").files[0];
  const message = document.getElementById("message").value;
  const status = document.getElementById("status");

  if (!file && !message.trim()) {
    status.textContent = "请至少上传图片或写点话";
    console.log("验证失败：两项都为空");
    return;
  }

  status.textContent = "上传中...";
  console.log("开始上传...");

  try {
    let imageUrl = "";
    let imageName = "";

    if (file) {
      imageName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `images/${imageName}`);
      console.log("创建存储引用:", storageRef);

      const snapshot = await uploadBytes(storageRef, file);
      console.log("文件上传成功:", snapshot);

      imageUrl = await getDownloadURL(snapshot.ref);
      console.log("获取下载URL:", imageUrl);
    }

    await addDoc(collection(db, "messages"), {
      message: message || "",
      imageUrl: imageUrl,
      imageName: imageName,
      createdAt: serverTimestamp()
    });

    console.log("数据保存到数据库成功");

    status.textContent = "上传成功！正在跳转...";
    setTimeout(() => {
      window.location.href = "./gallery.html";
    }, 1500);
  } catch (error) {
    console.error("上传失败", error);
    status.textContent = "上传失败，请重试";
  }
});
