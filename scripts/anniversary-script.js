// anniversary-script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATByXxkWxq1FRX5sLZgJA8ArX_VHSNATM",
  authDomain: "zhouyihe-birthday.firebaseapp.com",
  projectId: "zhouyihe-birthday",
  storageBucket: "zhouyihe-birthday.appspot.com",
  messagingSenderId: "602917163291",
  appId: "1:602917163291:web:4419834d2d7d29a22903be",
  measurementId: "G-KW2LDCM21C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function openModal() {
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modalText");
  modal.style.display = "flex";

  try {
    const docRef = doc(db, "anniversaryLetters", "letter2026");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const unlockDate = data.unlockDate.toDate();
      const now = new Date();

      if (now >= unlockDate) {
        modalText.innerHTML = data.text;
      } else {
        const updateCountdown = () => {
          const now = new Date();
          const diff = unlockDate - now;
          if (diff <= 0) {
            modalText.textContent = data.text;
            clearInterval(timer);
            return;
          }
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const m = Math.floor((diff / (1000 * 60)) % 60);
          const s = Math.floor((diff / 1000) % 60);

          modalText.innerHTML = `
            还不能看哦~<br>一周年就是 ${unlockDate.toLocaleDateString("zh-CN")}<br><br>
            还剩 <strong style="color:#d6336c; font-size:1.5em;">
            ${d}天 ${h}小时 ${m}分 ${s}秒</strong>
          `;
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
      }
    } else {
      modalText.textContent = "未找到密信";
    }
  } catch (e) {
    modalText.textContent = "加载失败: " + e.message;
  }
}

export function closeModal() {
  document.getElementById("modal").style.display = "none";
}
