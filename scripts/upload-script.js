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
    const storageRef = ref(storage, "images/" + file.name);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "messages"), {
      imageUrl,
      message,
      createdAt: serverTimestamp()
    });

    status.textContent = "上传成功 🎉";
    document.getElementById("imageInput").value = "";
    document.getElementById("message").value = "";
  } catch (error) {
    status.textContent = "上传失败 ❌";
    console.error(error);
  }
});
