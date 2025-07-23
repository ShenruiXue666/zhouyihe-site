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

// 判决书元素
const sentencePaper = document.getElementById("sentencePaper");
const crimeText = document.getElementById("crimeText");
const durationText = document.getElementById("durationText");
const sentenceTimeText = document.getElementById("sentenceTimeText");

const jailDocRef = doc(db, "status", "prison");

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function updateUI(data) {
  const { jailed, requested, crime, duration, sentencedAt } = data || {};
  
  if (jailed) {
    // 被关押状态
    emoji.textContent = "🔒";
    emoji.className = "imprisoned";
    
    if (requested) {
      statusText.textContent = "你已经申请出狱了，等她同意 🥺";
      statusText.className = "status-requested";
    } else {
      statusText.textContent = "你被关在恋爱监狱里了 😢";
      statusText.className = "status-imprisoned";
    }
    
    // 显示判决书
    if (crime && duration) {
      sentencePaper.style.display = "block";
      crimeText.textContent = crime;
      durationText.textContent = duration;
      
      if (sentencedAt?.toDate) {
        const date = sentencedAt.toDate();
        sentenceTimeText.textContent = formatDate(date);
      } else {
        sentenceTimeText.textContent = "未知";
      }
    } else {
      sentencePaper.style.display = "none";
    }
    
    // 按钮状态
    requestBtn.style.display = "inline-block";
    requestBtn.disabled = requested;
    requestBtn.textContent = requested ? "🕐 等待中..." : "🙏 申请出狱";
    freedomMsg.style.display = "none";
    
  } else {
    // 自由状态
    emoji.textContent = "🌈";
    emoji.className = "free";
    statusText.textContent = "你现在自由啦～她原谅你了 🕊";
    statusText.className = "status-free";
    
    sentencePaper.style.display = "none";
    requestBtn.style.display = "none";
    freedomMsg.style.display = "block";
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 
                 type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 
                 'rgba(33, 150, 243, 0.9)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 15px;
    backdrop-filter: blur(10px);
    z-index: 9999;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// 添加Toast动画CSS
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyle);

// 实时监听状态变化
onSnapshot(jailDocRef, (docSnap) => {
  if (docSnap.exists()) {
    updateUI(docSnap.data());
  } else {
    // 初始化数据
    setDoc(jailDocRef, { 
      jailed: false, 
      requested: false,
      crime: "",
      duration: "",
      sentencedAt: null
    });
  }
});

// 申请出狱按钮
requestBtn.addEventListener("click", async () => {
  if (requestBtn.disabled) return;
  
  try {
    requestBtn.disabled = true;
    const originalText = requestBtn.textContent;
    requestBtn.innerHTML = '<span class="loading"></span>申请中...';
    
    await updateDoc(jailDocRef, {
      requested: true,
    });
    
    showToast("申请已发送！等待女王的恩赦 🙏", "info");
    
  } catch (error) {
    console.error("申请出狱失败:", error);
    showToast("申请失败，请重试", "error");
    requestBtn.disabled = false;
    requestBtn.textContent = "🙏 申请出狱";
  }
});

// 创建监狱粒子效果
function createParticles() {
  const particles = ['⛓️', '🔒', '🗝️', '💔', '😢', '🚪'];
  const particlesContainer = document.getElementById('particles');
  
  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.innerHTML = particles[Math.floor(Math.random() * particles.length)];
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    particlesContainer.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 10000);
  }

  // 创建初始粒子
  for (let i = 0; i < 3; i++) {
    setTimeout(createParticle, i * 1000);
  }

  // 定期创建新粒子
  setInterval(createParticle, 3000);
}

// 初始化粒子效果
createParticles();
