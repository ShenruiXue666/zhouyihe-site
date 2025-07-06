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
const jailDocRef = doc(db, "status", "prison");

function updateUI(data) {
  const { jailed, requested } = data;
  if (jailed) {
    statusText.textContent = "你被关在恋爱监狱里了 😢";
    emoji.textContent = "🔒";
    requestBtn.style.display = "block";
    requestBtn.disabled = requested;
    requestBtn.textContent = requested ? "已申请出狱...等待她原谅" : "申请出狱";
  } else {
    statusText.textContent = "你自由了！她不生气啦 🥰";
    emoji.textContent = "🚪";
    requestBtn.style.display = "none";
  }
}

// 实时监听状态变化
onSnapshot(jailDocRef, (docSnap) => {
  if (docSnap.exists()) {
    updateUI(docSnap.data());
  } else {
    // 初始化
    setDoc(jailDocRef, { jailed: false, requested: false });
  }
});

// 申请出狱
requestBtn.addEventListener("click", async () => {
  await updateDoc(jailDocRef, {
    requested: true,
  });
});
