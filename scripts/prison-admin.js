// scripts/prison-admin.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const statusText = document.getElementById("currentStatus");
const lockBtn = document.getElementById("lockBtn");
const freeBtn = document.getElementById("freeBtn");
const jailDocRef = doc(db, "status", "prison");

function updateUI(data) {
  const { jailed, requested } = data;
  if (jailed) {
    statusText.textContent = requested
      ? "🔒 他被关着，还申请出狱了 🥺"
      : "🔒 他现在被关在恋爱监狱里";
  } else {
    statusText.textContent = "🌈 他现在自由啦～";
  }
}

// 实时监听状态
onSnapshot(jailDocRef, (docSnap) => {
  if (docSnap.exists()) {
    updateUI(docSnap.data());
  } else {
    setDoc(jailDocRef, { jailed: false, requested: false });
  }
});

// 关起来
lockBtn.addEventListener("click", async () => {
  await updateDoc(jailDocRef, {
    jailed: true,
    requested: false
  });
});

// 放出来
freeBtn.addEventListener("click", async () => {
  await updateDoc(jailDocRef, {
    jailed: false,
    requested: false
  });
});
