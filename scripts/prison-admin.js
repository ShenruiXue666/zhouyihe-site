// scripts/prison-admin.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { sendPrisonEmail, sendTestEmail, getEmailSettings } from "./email-service.js";

const statusText = document.getElementById("currentStatus");
const lockBtn = document.getElementById("lockBtn");
const freeBtn = document.getElementById("freeBtn");
const crimeSelect = document.getElementById("crimeSelect");
const customCrime = document.getElementById("customCrime");
const duration = document.getElementById("duration");

// 当前判决信息元素
const currentSentence = document.getElementById("currentSentence");
const currentCrime = document.getElementById("currentCrime");
const currentDuration = document.getElementById("currentDuration");
const sentenceTime = document.getElementById("sentenceTime");

// 邮件设置元素
const emailSettingsToggle = document.getElementById("emailSettingsToggle");
const emailSettingsPanel = document.getElementById("emailSettingsPanel");
const emailEnabled = document.getElementById("emailEnabled");
const yourEmail = document.getElementById("yourEmail");
const girlfriendEmail = document.getElementById("girlfriendEmail");
const saveEmailSettings = document.getElementById("saveEmailSettings");
const testEmail = document.getElementById("testEmail");

const jailDocRef = doc(db, "status", "prison");
const emailSettingsRef = doc(db, "settings", "email");

function updateUI(data) {
  const { jailed, requested, crime, duration: sentenceDuration, sentencedAt } = data || {};
  
  if (jailed) {
    // 显示当前状态
    statusText.innerHTML = requested
      ? "🔒 他被关着，还申请出狱了 🥺<br/><small>可以考虑是否原谅他...</small>"
      : "🔒 他现在被关在恋爱监狱里<br/><small>正在反省中...</small>";
    
    // 显示判决信息
    if (crime && sentenceDuration) {
      currentSentence.style.display = "block";
      currentCrime.textContent = crime;
      currentDuration.textContent = sentenceDuration;
      
      if (sentencedAt?.toDate) {
        const date = sentencedAt.toDate();
        sentenceTime.textContent = formatDate(date);
      } else {
        sentenceTime.textContent = "未知";
      }
    } else {
      currentSentence.style.display = "none";
    }
    
    // 按钮状态
    lockBtn.textContent = "🔄 重新判决";
    freeBtn.style.display = "inline-block";
  } else {
    statusText.innerHTML = "🌈 他现在自由啦～<br/><small>表现良好，继续保持</small>";
    currentSentence.style.display = "none";
    lockBtn.textContent = "🔒 执行判决";
    freeBtn.style.display = jailed ? "inline-block" : "none";
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getCrimeText() {
  if (crimeSelect.value === "自定义罪名") {
    return customCrime.value.trim() || "未指定罪名";
  }
  return crimeSelect.value || "未指定罪名";
}

function validateForm() {
  const crime = getCrimeText();
  const selectedDuration = duration.value;
  
  if (!crime || crime === "未指定罪名") {
    alert("请选择或填写罪名！");
    return false;
  }
  
  if (!selectedDuration) {
    alert("请选择刑期！");
    return false;
  }
  
  return true;
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

// 实时监听状态
onSnapshot(jailDocRef, (docSnap) => {
  if (docSnap.exists()) {
    updateUI(docSnap.data());
  } else {
    setDoc(jailDocRef, { 
      jailed: false, 
      requested: false,
      crime: "",
      duration: "",
      sentencedAt: null
    });
  }
});

// 执行判决
lockBtn.addEventListener("click", async () => {
  if (!validateForm()) {
    return;
  }
  
  const crime = getCrimeText();
  const selectedDuration = duration.value;
  
  const confirmMessage = `确认执行以下判决吗？\n\n罪名：${crime}\n刑期：${selectedDuration}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    lockBtn.disabled = true;
    lockBtn.textContent = "执行中...";
    
    await updateDoc(jailDocRef, {
      jailed: true,
      requested: false,
      crime: crime,
      duration: selectedDuration,
      sentencedAt: serverTimestamp()
    });
    
    // 发送入狱邮件通知
    try {
      const emailResult = await sendPrisonEmail('imprisoned', {
        crime: crime,
        duration: selectedDuration
      });
      if (emailResult.success) {
        showToast(`已成功关押！罪名：${crime}，刑期：${selectedDuration}\n📧 邮件通知已发送`, "success");
      } else {
        showToast(`已成功关押！罪名：${crime}，刑期：${selectedDuration}`, "success");
      }
    } catch (emailError) {
      console.error("发送入狱邮件失败:", emailError);
      showToast(`已成功关押！罪名：${crime}，刑期：${selectedDuration}`, "success");
    }
    
    // 清空表单
    crimeSelect.value = "";
    customCrime.value = "";
    document.getElementById("customCrimeGroup").style.display = "none";
    duration.value = "10分钟";
    
  } catch (error) {
    console.error("执行判决失败:", error);
    showToast("执行判决失败，请重试", "error");
  } finally {
    lockBtn.disabled = false;
  }
});

// 特赦释放
freeBtn.addEventListener("click", async () => {
  const confirmMessage = "确认特赦释放吗？他会重获自由哦～";
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    freeBtn.disabled = true;
    freeBtn.textContent = "释放中...";
    
    await updateDoc(jailDocRef, {
      jailed: false,
      requested: false
      // 保留犯罪记录，不清除crime, duration, sentencedAt
    });
    
    // 发送出狱邮件通知
    try {
      const emailResult = await sendPrisonEmail('released');
      if (emailResult.success) {
        showToast("已特赦释放！他重获自由了 🕊️\n📧 邮件通知已发送", "success");
      } else {
        showToast("已特赦释放！他重获自由了 🕊️", "success");
      }
    } catch (emailError) {
      console.error("发送出狱邮件失败:", emailError);
      showToast("已特赦释放！他重获自由了 🕊️", "success");
    }
    
  } catch (error) {
    console.error("释放失败:", error);
    showToast("释放失败，请重试", "error");
  } finally {
    freeBtn.disabled = false;
    freeBtn.textContent = "🔓 特赦释放";
  }
});

// 邮件设置功能
async function loadEmailSettings() {
  try {
    const settings = await getEmailSettings();
    emailEnabled.checked = settings.enabled || false;
    yourEmail.value = settings.yourEmail || '';
    girlfriendEmail.value = settings.girlfriendEmail || '';
  } catch (error) {
    console.error("加载邮件设置失败:", error);
  }
}

// 邮件设置切换
emailSettingsToggle.addEventListener("click", () => {
  const isVisible = emailSettingsPanel.style.display !== "none";
  emailSettingsPanel.style.display = isVisible ? "none" : "block";
  
  if (!isVisible) {
    loadEmailSettings();
  }
});

// 保存邮件设置
saveEmailSettings.addEventListener("click", async () => {
  try {
    saveEmailSettings.disabled = true;
    saveEmailSettings.textContent = "保存中...";
    
    const settings = {
      enabled: emailEnabled.checked,
      yourEmail: yourEmail.value.trim(),
      girlfriendEmail: girlfriendEmail.value.trim(),
      updatedAt: serverTimestamp()
    };
    
    // 验证邮箱格式
    if (settings.enabled && (!settings.yourEmail || !settings.girlfriendEmail)) {
      alert("启用邮件提醒时，请填写完整的邮箱地址！");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.yourEmail && !emailRegex.test(settings.yourEmail)) {
      alert("请输入有效的邮箱地址（你的邮箱）！");
      return;
    }
    
    if (settings.girlfriendEmail && !emailRegex.test(settings.girlfriendEmail)) {
      alert("请输入有效的邮箱地址（女朋友的邮箱）！");
      return;
    }
    
    await setDoc(emailSettingsRef, settings);
    showToast("邮件设置保存成功！📧", "success");
    
  } catch (error) {
    console.error("保存邮件设置失败:", error);
    showToast("保存失败，请重试", "error");
  } finally {
    saveEmailSettings.disabled = false;
    saveEmailSettings.textContent = "💾 保存设置";
  }
});

// 发送测试邮件
testEmail.addEventListener("click", async () => {
  try {
    testEmail.disabled = true;
    testEmail.textContent = "发送中...";
    
    const result = await sendTestEmail();
    
    if (result.success) {
      showToast("测试邮件发送成功！请查收邮箱 📧", "success");
    } else {
      showToast(`测试邮件发送失败：${result.message}`, "error");
    }
    
  } catch (error) {
    console.error("发送测试邮件失败:", error);
    showToast("发送测试邮件失败，请检查设置", "error");
  } finally {
    testEmail.disabled = false;
    testEmail.textContent = "🧪 发送测试邮件";
  }
});

// 初始化邮件设置
loadEmailSettings();
