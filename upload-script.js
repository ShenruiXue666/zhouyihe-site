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

console.log("上传按钮元素:", uploadBtn);

// 文件选择事件
fileInput.addEventListener("change", (e) => {
  const selectedFileName = e.target.files[0]?.name || "未选择任何文件";
  fileName.textContent = selectedFileName;
  fileName.style.color = selectedFileName !== "未选择任何文件" ? "var(--primary-pink)" : "";
  console.log("文件已选择:", selectedFileName);
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
      }
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
