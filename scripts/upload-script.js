import { db, storage } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

console.log("脚本已加载");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("imageInput");
const fileName = document.getElementById("fileName");
const stickerGrid = document.getElementById("stickerGrid");
const selectedStickers = document.getElementById("selectedStickers");
const clearStickers = document.getElementById("clearStickers");

console.log("上传按钮元素:", uploadBtn);

// 贴纸管理
let selectedStickersData = [];

// 文件选择事件
fileInput.addEventListener("change", (e) => {
  const selectedFileName = e.target.files[0]?.name || "未选择任何文件";
  fileName.textContent = selectedFileName;
  fileName.style.color = selectedFileName !== "未选择任何文件" ? "var(--primary-pink)" : "";
  console.log("文件已选择:", selectedFileName);
});

// 贴纸选择功能
stickerGrid.addEventListener("click", (e) => {
  if (e.target.classList.contains("sticker-item")) {
    const emoji = e.target.dataset.emoji;
    addSticker(emoji);
    
    // 添加选中动画
    e.target.classList.add("selected");
    setTimeout(() => {
      e.target.classList.remove("selected");
    }, 500);
  }
});

// 添加贴纸
function addSticker(emoji) {
  // 限制最多8个贴纸
  if (selectedStickersData.length >= 8) {
    showToast("最多只能添加8个贴纸哦！", "warning");
    return;
  }

  // 随机生成位置（避免重叠）
  const position = generateRandomPosition();
  
  const stickerData = {
    emoji: emoji,
    x: position.x,
    y: position.y,
    id: Date.now() + Math.random()
  };

  selectedStickersData.push(stickerData);
  updateSelectedStickersDisplay();
  
  showToast(`已添加贴纸 ${emoji}`, "success");
}

// 生成随机位置
function generateRandomPosition() {
  const attempts = 50; // 最大尝试次数
  let position;
  
  for (let i = 0; i < attempts; i++) {
    position = {
      x: Math.random() * 70 + 10, // 10%-80% 范围
      y: Math.random() * 60 + 10  // 10%-70% 范围
    };
    
    // 检查是否与现有贴纸重叠
    const isOverlapping = selectedStickersData.some(sticker => {
      const distance = Math.sqrt(
        Math.pow(position.x - sticker.x, 2) + 
        Math.pow(position.y - sticker.y, 2)
      );
      return distance < 15; // 最小距离15%
    });
    
    if (!isOverlapping) {
      break;
    }
  }
  
  return position;
}

// 更新已选择贴纸显示
function updateSelectedStickersDisplay() {
  if (selectedStickersData.length === 0) {
    selectedStickers.innerHTML = '<p class="stickers-hint">点击贴纸添加到你的照片上 💖</p>';
    return;
  }

  let html = '';
  selectedStickersData.forEach((sticker, index) => {
    html += `
      <div class="selected-sticker" data-id="${sticker.id}">
        <span>${sticker.emoji}</span>
        <button class="sticker-remove" onclick="removeSticker('${sticker.id}')">×</button>
      </div>
    `;
  });
  
  selectedStickers.innerHTML = html;
}

// 移除贴纸
window.removeSticker = function(stickerId) {
  selectedStickersData = selectedStickersData.filter(sticker => sticker.id !== stickerId);
  updateSelectedStickersDisplay();
  showToast("已移除贴纸", "info");
};

// 清空所有贴纸
clearStickers.addEventListener("click", () => {
  if (selectedStickersData.length === 0) {
    showToast("没有贴纸需要清空", "info");
    return;
  }
  
  selectedStickersData = [];
  updateSelectedStickersDisplay();
  showToast("已清空所有贴纸", "success");
});

// 显示提示消息
function showToast(message, type = "info") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = type;
  
  setTimeout(() => {
    if (status.textContent === message) {
      status.textContent = "";
      status.className = "";
    }
  }, 2000);
}

// 上传功能
uploadBtn.addEventListener("click", async () => {
  console.log("上传按钮被点击");
  const file = fileInput.files[0];
  const message = document.getElementById("message").value.trim();
  const status = document.getElementById("status");

  // 验证输入
  if (!file && !message) {
    status.textContent = "❌ 请至少上传图片或写点话";
    status.className = "error";
    console.log("验证失败：两项都为空");
    return;
  }

  // 检查贴纸是否需要图片
  if (selectedStickersData.length > 0 && !file) {
    status.textContent = "❌ 添加了贴纸需要同时上传图片";
    status.className = "error";
    return;
  }

  // 禁用按钮，防止重复提交
  uploadBtn.disabled = true;
  uploadBtn.classList.add("loading");
  uploadBtn.textContent = "上传中...";
  
  status.textContent = "🚀 正在上传，请稍候...";
  status.className = "";
  console.log("开始上传...");

  try {
    let imageUrl = "";
    let imageName = "";

    // 上传图片（如果有）
    if (file) {
      status.textContent = "📷 正在上传图片...";
      imageName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `images/${imageName}`);
      console.log("创建存储引用:", storageRef);

      const snapshot = await uploadBytes(storageRef, file);
      console.log("文件上传成功:", snapshot);

      imageUrl = await getDownloadURL(snapshot.ref);
      console.log("获取下载URL:", imageUrl);
    }

    // 保存到数据库
    status.textContent = "💾 正在保存数据...";
    
    const messageData = {
      message: message || "",
      imageUrl: imageUrl,
      imageName: imageName,
      createdAt: serverTimestamp(),
      likes: {
        xpx: false,
        "404": false
      },
      stickers: selectedStickersData.map(sticker => ({
        emoji: sticker.emoji,
        x: sticker.x,
        y: sticker.y
      }))
    };

    await addDoc(collection(db, "messages"), messageData);

    console.log("数据保存到数据库成功", messageData);

    // 成功反馈
    status.textContent = "✅ 上传成功！正在跳转到相册...";
    status.className = "success";
    
    // 清空表单
    fileInput.value = "";
    document.getElementById("message").value = "";
    fileName.textContent = "未选择任何文件";
    fileName.style.color = "";
    selectedStickersData = [];
    updateSelectedStickersDisplay();
    
    // 创建成功粒子效果
    createSuccessParticles();
    
    setTimeout(() => {
      window.location.href = "./gallery.html";
    }, 1500);
    
  } catch (error) {
    console.error("上传失败", error);
    status.textContent = "❌ 上传失败，请检查网络连接后重试";
    status.className = "error";
    
    // 恢复按钮状态
    uploadBtn.disabled = false;
    uploadBtn.classList.remove("loading");
    uploadBtn.textContent = "发送留言";
  }
});

// 创建成功粒子效果
function createSuccessParticles() {
  const particles = ['✨', '💖', '🌟', '💕', '🎉'];
  
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = Math.random() * window.innerWidth + 'px';
      particle.style.top = Math.random() * window.innerHeight + 'px';
      particle.style.fontSize = '2rem';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      particle.style.animation = 'particleFloat 3s ease-out forwards';
      particle.textContent = particles[Math.floor(Math.random() * particles.length)];
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 3000);
    }, i * 100);
  }
}

// 添加粒子动画CSS
const particleStyle = document.createElement('style');
particleStyle.textContent = `
  @keyframes particleFloat {
    0% {
      opacity: 1;
      transform: translateY(0) scale(0.5) rotate(0deg);
    }
    100% {
      opacity: 0;
      transform: translateY(-200px) scale(1.5) rotate(360deg);
    }
  }
`;
document.head.appendChild(particleStyle);
