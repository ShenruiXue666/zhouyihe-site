import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const gallery = document.getElementById("gallery");

async function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = "留言图片";

    const text = document.createElement("p");
    text.textContent = data.message;

    card.appendChild(img);
    card.appendChild(text);
    gallery.appendChild(card);
  });
}

loadMessages();
