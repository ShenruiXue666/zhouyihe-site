import { db } from "./firebase.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const statusText = document.getElementById("statusText");
const emoji = document.getElementById("emoji");
const freedomMsg = document.getElementById("freedomMsg");
const escapeBtn = document.getElementById("escapeBtn");

const docRef = doc(db, "prison", "status");

// 实时监听监狱状态
onSnapshot(docRef, (docSnap) => {
  if (docSnap.exists()) {
    const locked = docSnap.data().locked;
    if (locked) {
      emoji.textContent = "⛓️";
      statusText.textContent = "你目前被关起来啦...";
      escapeBtn.style.display = "inline-block";
      freedomMsg.style.display = "none";
    } else {
      emoji.textContent = "🌈";
      statusText.textContent = "你现在自由啦！";
      escapeBtn.style.display = "none";
      freedomMsg.style.display = "block";
    }
  } else {
    statusText.textContent = "监狱状态未知～";
  }
});

// 点击“申请出狱”按钮，仅展示提示
escapeBtn.addEventListener("click", () => {
  alert("你发出了一个可怜的请求，希望她能放你出来🥺");
});
