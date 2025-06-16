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

const uploadBtn = document.getElementById("uploadBtn");

document.getElementById("imageInput").addEventListener("change", (e) => {
  const fileName = e.target.files[0]?.name || "未选择任何文件";
  document.getElementById("fileName").textContent = fileName;
});

uploadBtn.addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  const message = document.getElementById("message").value;
  const status = document.getElementById("status");

  if (!file || !message.trim()) {
    status.textContent = "请上传图片并写点话";
    return;
  }

  status.textContent = "上传中...";

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
  
    await addDoc(collection(db, "messages"), {
      message: message,
      imageUrl: downloadURL,
      createdAt: serverTimestamp()
    });
  
    status.textContent = "上传成功！正在跳转...";
    setTimeout(() => {
      window.location.href = "./gallery.html";
    }, 1500);
  } catch (error) {
    console.error("上传失败", error);
    status.textContent = "上传失败，请重试";
  }
  
});
