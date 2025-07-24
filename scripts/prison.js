// scripts/prison.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { sendPrisonEmail } from "./email-service.js";

const statusText = document.getElementById("prisonStatus");
const emoji = document.getElementById("emojiIcon");
const requestBtn = document.getElementById("requestBtn");
const freedomMsg = document.getElementById("freedomMsg");

// 判决书元素
const sentencePaper = document.getElementById("sentencePaper");
const crimeText = document.getElementById("crimeText");
const durationText = document.getElementById("durationText");
const sentenceTimeText = document.getElementById("sentenceTimeText");
let countdownTimer = null;
let countdownElem = null;

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
        // 倒计时显示
        showCountdown(duration, date, jailed);
      } else {
        sentenceTimeText.textContent = "未知";
        clearCountdown();
      }
    } else {
      sentencePaper.style.display = "none";
      clearCountdown();
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
    clearCountdown();
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
    // 弹窗输入原因
    let reason = prompt("请输入申请出狱的原因（可选）", "");
    if (reason === null) {
      // 用户取消
      return;
    }
    reason = reason.trim();
    requestBtn.disabled = true;
    const originalText = requestBtn.textContent;
    requestBtn.innerHTML = '<span class="loading"></span>申请中...';
    
    await updateDoc(jailDocRef, {
      requested: true,
      requestReason: reason || ""
    });
    
    // 发送申请出狱邮件，带上原因
    try {
      const emailResult = await sendPrisonEmail('requestRelease', { reason });
      if (emailResult.success) {
        showToast("申请已发送！邮件通知已发送 📧", "success");
      } else {
        showToast("申请已发送！等待女王的恩赦 🙏", "info");
      }
    } catch (emailError) {
      console.error("发送邮件失败:", emailError);
      showToast("申请已发送！等待女王的恩赦 🙏", "info");
    }
    
  } catch (error) {
    console.error("申请出狱失败:", error);
    showToast("申请失败，请重试", "error");
    requestBtn.disabled = false;
    requestBtn.textContent = "🙏 申请出狱";
  }
});

// 解析刑期字符串为毫秒数
function parseDurationToMs(durationStr) {
  if (!durationStr) return 0;
  if (durationStr.includes("分钟")) return parseInt(durationStr) * 60 * 1000;
  if (durationStr.includes("小时")) return parseInt(durationStr) * 60 * 60 * 1000;
  if (durationStr.includes("天")) return parseInt(durationStr) * 24 * 60 * 60 * 1000;
  if (durationStr.includes("半天")) return 12 * 60 * 60 * 1000;
  if (durationStr.includes("无期")) return 99 * 365 * 24 * 60 * 60 * 1000;
  return 0;
}

// 显示倒计时
function showCountdown(durationStr, startDate, jailed) {
  clearCountdown();
  if (!jailed) return;
  const durationMs = parseDurationToMs(durationStr);
  if (!durationMs || !startDate) return;
  let endTime = startDate.getTime() + durationMs;
  if (!countdownElem) {
    countdownElem = document.createElement('div');
    countdownElem.id = 'prisonCountdown';
    countdownElem.style = 'margin-top: 1rem; font-size: 1.2rem; color: #ff6b6b; font-weight: bold;';
    sentencePaper.appendChild(countdownElem);
  }
  function updateCountdown() {
    const now = Date.now();
    let left = endTime - now;
    if (left <= 0) {
      countdownElem.textContent = '刑期已满，等待释放...';
      clearInterval(countdownTimer);
      countdownTimer = null;
      // 可选：自动切换UI为自由状态（不改数据库）
      emoji.textContent = "🌈";
      emoji.className = "free";
      statusText.textContent = "你现在自由啦～刑期已满 🕊";
      statusText.className = "status-free";
      requestBtn.style.display = "none";
      freedomMsg.style.display = "block";
      sentencePaper.style.display = "none";
      return;
    }
    // 格式化剩余时间
    let sec = Math.floor(left / 1000) % 60;
    let min = Math.floor(left / 1000 / 60) % 60;
    let hour = Math.floor(left / 1000 / 60 / 60) % 24;
    let day = Math.floor(left / 1000 / 60 / 60 / 24);
    let str = '';
    if (day > 0) str += `${day}天`;
    if (hour > 0) str += `${hour}小时`;
    if (min > 0) str += `${min}分`;
    str += `${sec}秒`;
    countdownElem.textContent = `距离刑期结束：${str}`;
  }
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (countdownElem && countdownElem.parentNode) {
    countdownElem.parentNode.removeChild(countdownElem);
    countdownElem = null;
  }
}

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
