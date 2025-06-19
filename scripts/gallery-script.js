import { db, storage } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const gallery = document.getElementById("gallery");

async function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docSnap) => {
  const data = docSnap.data();
  const docId = docSnap.id;
  const imageUrl = data.imageUrl;
  const message = data.message;
  const imageName = data.imageName;

  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("data-id", docId);
  card.setAttribute("data-img", imageName);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "留言图片";
    card.appendChild(img);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = "🗯️";
    card.appendChild(bubble);
  }

  const text = document.createElement("p");
  text.textContent = message || "（无文字）";
  card.appendChild(text);

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "删除";
  card.appendChild(delBtn);

  gallery.appendChild(card);
});

}

// 删除事件监听
gallery.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const card = e.target.closest(".card");
    const docId = card.dataset.id;
    const imageName = card.dataset.img;

    if (!confirm("确认删除这条留言和图片吗？")) return;

    try {
      // 删除 Firestore 文档
      await deleteDoc(doc(db, "messages", docId));

      // 删除 Storage 文件
      const imageRef = ref(storage, `images/${imageName}`);
      await deleteObject(imageRef);

      // 从页面移除
      card.classList.add("fade-out");
      setTimeout(() => {
        card.remove();
      }, 500); // 等动画结束后移除

    } catch (err) {
      console.error("删除失败", err);
      alert("❌ 删除失败，请重试！");
    }
  }
});

loadMessages();
