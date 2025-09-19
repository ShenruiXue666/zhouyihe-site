// scripts/prison.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const statusText = document.getElementById("prisonStatus");
const emoji = document.getElementById("emojiIcon");
const requestBtn = document.getElementById("requestBtn");
const freedomMsg = document.getElementById("freedomMsg");

const jailDocRef = doc(db, "status", "prison");

function updateUI(data) {
  const { jailed, requested } = data;
  if (jailed) {
    emoji.textContent = "🔒";
    statusText.textContent = requested
      ? "你已经申请出狱了，等她同意 🥺"
      : "你被关在恋爱监狱里了 😢";
    requestBtn.style.display = "inline-block";
    requestBtn.disabled = requested;
    requestBtn.textContent = requested ? "等待中..." : "🙏 申请出狱";
    freedomMsg.style.display = "none";
  } else {
    emoji.textContent = "🌈";
    statusText.textContent = "你现在自由啦～她原谅你了 🕊";
    requestBtn.style.display = "none";
    freedomMsg.style.display = "block";
  }
}

// 实时监听
onSnapshot(jailDocRef, (docSnap) => {
  if (docSnap.exists()) {
    updateUI(docSnap.data());
  } else {
    setDoc(jailDocRef, { jailed: false, requested: false });
  }
});

// 申请出狱按钮
requestBtn.addEventListener("click", async () => {
  await updateDoc(jailDocRef, {
    requested: true,
  });
});
