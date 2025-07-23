import { db, storage } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const gallery = document.getElementById("gallery");
const fullscreenModal = document.getElementById("fullscreenModal");
const fullscreenImage = document.getElementById("fullscreenImage");
const fullscreenInfo = document.getElementById("fullscreenInfo");
const closeFullscreen = document.getElementById("closeFullscreen");

async function loadMessages() {
  // 显示加载状态
  gallery.innerHTML = `
    <div class="loading-placeholder">
      <div class="loading-card"><div class="loading-image"></div><div class="loading-text"></div></div>
      <div class="loading-card"><div class="loading-image"></div><div class="loading-text"></div></div>
      <div class="loading-card"><div class="loading-image"></div><div class="loading-text"></div></div>
    </div>
  `;

  try {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    // 清空加载状态
    gallery.innerHTML = "";

    if (querySnapshot.empty) {
      // 显示空状态
      gallery.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💌</div>
          <h3>还没有留言哦</h3>
          <p>快去上传第一条留言吧！<br/>分享你的美好时光 ✨</p>
        </div>
      `;
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const { imageUrl, message, imageName, createdAt, likes = { xpx: false, "404": false } } = data;
      
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = doc.id;
      card.dataset.imageName = imageName || "";

      let cardHTML = "";

      if (imageUrl) {
        cardHTML += `
          <div class="image-container">
            <img src="${imageUrl}" alt="留言图片" loading="lazy">
          </div>
        `;
        
        // 图片点击全屏
        card.addEventListener("click", (e) => {
          if (!e.target.closest('.like-button') && !e.target.closest('.delete-btn')) {
            openFullscreen(imageUrl, message, createdAt?.toDate());
          }
        });
      }

      // 留言内容
      if (message && message.trim()) {
        cardHTML += `
          <div class="message-text">
            ${message}
          </div>
        `;
      }

      // 时间戳
      if (createdAt?.toDate) {
        const date = createdAt.toDate();
        cardHTML += `
          <div class="timestamp">
            🎀 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}
          </div>
        `;
      }

      // 点赞区域
      cardHTML += `
        <div class="like-section">
          <div class="like-button ${likes.xpx ? 'liked' : ''}">
            <span class="like-icon">💕</span>
            <span class="like-text">xpx</span>
          </div>
          <div class="like-button ${likes["404"] ? 'liked' : ''}">
            <span class="like-icon">💕</span>
            <span class="like-text">404</span>
          </div>
        </div>
      `;

      // 删除按钮
      cardHTML += `
        <button class="delete-btn">×</button>
      `;

      card.innerHTML = cardHTML;
      
      // 绑定点赞事件
      const likeButtons = card.querySelectorAll('.like-button');
      likeButtons.forEach(button => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const user = button.querySelector('.like-text').textContent;
          toggleLike(doc.id, user, button);
        });
      });
      
      // 绑定删除事件
      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const docId = doc.id;
        const imageName = card.dataset.imageName;

        if (!confirm("确认删除这条留言和图片吗？")) return;

        try {
          deleteBtn.disabled = true;
          deleteBtn.textContent = "删除中...";

          // 删除图片文件（如果有）
          if (imageName) {
            const imageRef = ref(storage, `images/${imageName}`);
            try {
              await deleteObject(imageRef);
              console.log("图片删除成功");
            } catch (storageError) {
              console.log("图片可能已被删除:", storageError);
            }
          }

          // 删除数据库记录
          await deleteDoc(doc(db, "messages", docId));

          // 移除卡片元素
          card.remove();

          showToast("删除成功！", "success");
        } catch (error) {
          console.error("删除失败:", error);
          showToast("删除失败，请重试", "error");
          deleteBtn.disabled = false;
          deleteBtn.textContent = "×";
        }
      });
      
      gallery.appendChild(card);
    });
  } catch (error) {
    console.error("加载留言失败:", error);
    gallery.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😢</div>
        <h3>加载失败</h3>
        <p>请检查网络连接后刷新页面重试</p>
      </div>
    `;
  }
}

// 切换点赞状态
async function toggleLike(docId, user, buttonElement) {
  try {
    const isLiked = buttonElement.classList.contains("liked");
    const newLikeStatus = !isLiked;
    
    // 立即更新UI（乐观更新）
    if (newLikeStatus) {
      buttonElement.classList.add("liked");
      showToast(`${user} 点了赞！`, "success");
    } else {
      buttonElement.classList.remove("liked");
      showToast(`${user} 取消了赞`, "info");
    }

    // 更新数据库
    const updateData = {};
    updateData[`likes.${user}`] = newLikeStatus;
    
    await updateDoc(doc(db, "messages", docId), updateData);
    
    console.log(`点赞状态更新成功: ${user} = ${newLikeStatus}`);
    
  } catch (error) {
    console.error("点赞失败:", error);
    // 恢复按钮状态
    if (buttonElement.classList.contains("liked")) {
      buttonElement.classList.remove("liked");
    } else {
      buttonElement.classList.add("liked");
    }
    showToast("操作失败，请重试", "error");
  }
}

// 显示提示消息
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

// 打开全屏模式
function openFullscreen(imageUrl, message, date) {
  fullscreenImage.src = imageUrl;
  
  let infoHtml = "";
  if (message) {
    infoHtml += `<p style="font-size: 1.2rem; margin-bottom: 1rem;">${message}</p>`;
  }
  if (date) {
    infoHtml += `<p style="opacity: 0.8;">📅 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}</p>`;
  }
  
  fullscreenInfo.innerHTML = infoHtml;
  fullscreenModal.classList.add("active");
  
  // 禁用页面滚动
  document.body.style.overflow = "hidden";
}

// 关闭全屏模式
function closeFullscreenMode() {
  fullscreenModal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// 事件监听器
closeFullscreen.addEventListener("click", closeFullscreenMode);

fullscreenModal.addEventListener("click", (e) => {
  if (e.target === fullscreenModal) {
    closeFullscreenMode();
  }
});

// ESC键关闭全屏
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && fullscreenModal.classList.contains("active")) {
    closeFullscreenMode();
  }
});

// 删除功能
gallery.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const card = e.target.closest(".card");
    const docId = card.dataset.id;
    const imageName = card.dataset.imageName;

    if (!confirm("确认删除这条留言和图片吗？")) return;

    try {
      // 添加删除动画
      card.style.transform = "scale(0.8)";
      card.style.opacity = "0";
      
      await deleteDoc(doc(db, "messages", docId));
      if (imageName) {
        const imageRef = ref(storage, `images/${imageName}`);
        await deleteObject(imageRef);
      }
      
      setTimeout(() => {
        card.remove();
      }, 300);
      
      showToast("删除成功", "success");
      
    } catch (err) {
      console.error("删除失败", err);
      showToast("删除失败，请重试", "error");
      // 恢复卡片状态
      card.style.transform = "";
      card.style.opacity = "";
    }
  }
});

loadMessages();

// 滚动动画观察器
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
    }
  });
}, observerOptions);

// 监听新添加的卡片
function observeNewCards() {
  document.querySelectorAll('.card:not(.revealed)').forEach(card => {
    card.classList.add('scroll-reveal');
    observer.observe(card);
  });
}

// 初始化滚动动画
setTimeout(observeNewCards, 1000);

// 监听 gallery 容器的变化，当新卡片添加时自动应用动画
const galleryObserver = new MutationObserver(observeNewCards);
galleryObserver.observe(document.getElementById('gallery'), { 
  childList: true 
});

// 页面加载完成动画
window.addEventListener('load', () => {
  // 为现有卡片添加staggered动画
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${0.8 + index * 0.2}s`;
  });
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
