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
    const { imageUrl, message, imageName, createdAt } = data;

    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = docId;
    card.dataset.img = imageName;

    // 图片
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "留言图片";
      card.appendChild(img);
    }

    // 留言内容（文字气泡）
    const text = document.createElement("p");
    text.textContent = message || " ";
    card.appendChild(text);

    // 时间戳
    if (createdAt?.toDate) {
      const time = document.createElement("div");
      const date = createdAt.toDate();
      time.className = "timestamp";
      time.textContent = `🎀 ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      card.appendChild(time);
    }

    // 删除按钮
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "删除";
    card.appendChild(delBtn);

    gallery.appendChild(card);
  });
}

// 删除功能
gallery.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const card = e.target.closest(".card");
    const docId = card.dataset.id;
    const imageName = card.dataset.img;

    if (!confirm("确认删除这条留言和图片吗？")) return;

    try {
      await deleteDoc(doc(db, "messages", docId));
      if (imageName) {
        const imageRef = ref(storage, `images/${imageName}`);
        await deleteObject(imageRef);
      }
      card.remove();
    } catch (err) {
      console.error("删除失败", err);
      alert("❌ 删除失败，请重试！");
    }
  }
});

loadMessages();
