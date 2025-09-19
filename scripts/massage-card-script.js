import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

console.log("按摩卡脚本已加载");

// 获取DOM元素 - 我的按摩卡
const myCountDisplay = document.getElementById("myCountDisplay");
const myAddBtn = document.getElementById("myAddBtn");
const myUseBtn = document.getElementById("myUseBtn");
const myAddForm = document.getElementById("myAddForm");
const myAddCountInput = document.getElementById("myAddCount");
const myCancelBtn = document.getElementById("myCancelBtn");
const myConfirmBtn = document.getElementById("myConfirmBtn");
const myStatusMessage = document.getElementById("myStatusMessage");

// 获取DOM元素 - 她的按摩卡
const herCountDisplay = document.getElementById("herCountDisplay");
const herAddBtn = document.getElementById("herAddBtn");
const herUseBtn = document.getElementById("herUseBtn");
const herAddForm = document.getElementById("herAddForm");
const herAddCountInput = document.getElementById("herAddCount");
const herCancelBtn = document.getElementById("herCancelBtn");
const herConfirmBtn = document.getElementById("herConfirmBtn");
const herStatusMessage = document.getElementById("herStatusMessage");

// 按摩卡数据
let myMassageData = {
  remainingCount: 0,
  totalAdded: 0,
  totalUsed: 0,
  lastUpdated: null
};

let herMassageData = {
  remainingCount: 0,
  totalAdded: 0,
  totalUsed: 0,
  lastUpdated: null
};

// 初始化页面
async function init() {
  try {
    await loadMassageData();
    updateDisplay();
    console.log("按摩卡数据加载完成");
  } catch (error) {
    console.error("初始化失败:", error);
    showStatus("加载数据失败，请刷新页面重试", "error", "my");
  }
}

// 从Firestore加载按摩卡数据
async function loadMassageData() {
  try {
    // 加载我的按摩卡数据
    const myDocRef = doc(db, "massageCard", "myData");
    const myDocSnap = await getDoc(myDocRef);
    
    if (myDocSnap.exists()) {
      myMassageData = { ...myMassageData, ...myDocSnap.data() };
      console.log("从数据库加载我的数据:", myMassageData);
    } else {
      await saveMassageData("my");
      console.log("创建初始我的按摩卡数据");
    }

    // 加载她的按摩卡数据
    const herDocRef = doc(db, "massageCard", "herData");
    const herDocSnap = await getDoc(herDocRef);
    
    if (herDocSnap.exists()) {
      herMassageData = { ...herMassageData, ...herDocSnap.data() };
      console.log("从数据库加载她的数据:", herMassageData);
    } else {
      await saveMassageData("her");
      console.log("创建初始她的按摩卡数据");
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    throw error;
  }
}

// 保存按摩卡数据到Firestore
async function saveMassageData(type) {
  try {
    const docRef = doc(db, "massageCard", `${type}Data`);
    const dataToSave = type === "my" 
      ? { ...myMassageData, lastUpdated: serverTimestamp() }
      : { ...herMassageData, lastUpdated: serverTimestamp() };
    
    await setDoc(docRef, dataToSave);
    console.log(`${type}数据保存成功:`, dataToSave);
  } catch (error) {
    console.error("保存数据失败:", error);
    throw error;
  }
}

// 更新显示
function updateDisplay() {
  // 更新我的按摩卡显示
  myCountDisplay.textContent = myMassageData.remainingCount;
  myUseBtn.disabled = myMassageData.remainingCount <= 0;
  
  if (myMassageData.remainingCount > 0) {
    myUseBtn.textContent = `确认按摩 (剩余${myMassageData.remainingCount}次)`;
  } else {
    myUseBtn.textContent = "确认按摩";
  }

  // 更新她的按摩卡显示
  herCountDisplay.textContent = herMassageData.remainingCount;
  herUseBtn.disabled = herMassageData.remainingCount <= 0;
  
  if (herMassageData.remainingCount > 0) {
    herUseBtn.textContent = `确认按摩 (剩余${herMassageData.remainingCount}次)`;
  } else {
    herUseBtn.textContent = "确认按摩";
  }
}

// 显示状态消息
function showStatus(message, type = "success", cardType = "my") {
  const statusElement = cardType === "my" ? myStatusMessage : herStatusMessage;
  statusElement.textContent = message;
  statusElement.className = `status-message status-${type}`;
  statusElement.style.display = "block";
  
  // 3秒后隐藏消息
  setTimeout(() => {
    statusElement.style.display = "none";
  }, 3000);
}

// 增加按摩次数
async function addMassageCount(count, cardType) {
  try {
    if (cardType === "my") {
      myMassageData.remainingCount += count;
      myMassageData.totalAdded += count;
    } else {
      herMassageData.remainingCount += count;
      herMassageData.totalAdded += count;
    }
    
    await saveMassageData(cardType);
    updateDisplay();
    
    showStatus(`成功增加 ${count} 次按摩！`, "success", cardType);
    console.log(`增加${cardType}按摩次数: ${count}, 当前剩余: ${cardType === "my" ? myMassageData.remainingCount : herMassageData.remainingCount}`);
  } catch (error) {
    console.error("增加次数失败:", error);
    showStatus("增加次数失败，请重试", "error", cardType);
  }
}

// 使用按摩次数
async function useMassageCount(cardType) {
  const data = cardType === "my" ? myMassageData : herMassageData;
  
  if (data.remainingCount <= 0) {
    showStatus("没有剩余按摩次数了！", "error", cardType);
    return;
  }
  
  try {
    if (cardType === "my") {
      myMassageData.remainingCount -= 1;
      myMassageData.totalUsed += 1;
    } else {
      herMassageData.remainingCount -= 1;
      herMassageData.totalUsed += 1;
    }
    
    await saveMassageData(cardType);
    updateDisplay();
    
    showStatus("按摩次数已确认使用！💆‍♀️", "success", cardType);
    console.log(`使用${cardType}按摩次数: 1, 当前剩余: ${data.remainingCount}`);
  } catch (error) {
    console.error("使用次数失败:", error);
    showStatus("确认按摩失败，请重试", "error", cardType);
  }
}

// 我的按摩卡事件监听器
myAddBtn.addEventListener("click", () => {
  myAddForm.classList.add("show");
  myAddCountInput.focus();
  myAddCountInput.select();
});

myCancelBtn.addEventListener("click", () => {
  myAddForm.classList.remove("show");
  myAddCountInput.value = "1";
});

myConfirmBtn.addEventListener("click", async () => {
  const count = parseInt(myAddCountInput.value);
  
  if (isNaN(count) || count <= 0) {
    showStatus("请输入有效的次数", "error", "my");
    return;
  }
  
  if (count > 100) {
    showStatus("单次最多增加100次", "error", "my");
    return;
  }
  
  myAddForm.classList.remove("show");
  await addMassageCount(count, "my");
  myAddCountInput.value = "1";
});

myUseBtn.addEventListener("click", async () => {
  if (myMassageData.remainingCount <= 0) {
    showStatus("没有剩余按摩次数了！", "error", "my");
    return;
  }
  
  const confirmed = confirm(`确认使用一次按摩吗？\n剩余次数: ${myMassageData.remainingCount}`);
  if (confirmed) {
    await useMassageCount("my");
  }
});

myAddCountInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    myConfirmBtn.click();
  }
});

// 她的按摩卡事件监听器
herAddBtn.addEventListener("click", () => {
  herAddForm.classList.add("show");
  herAddCountInput.focus();
  herAddCountInput.select();
});

herCancelBtn.addEventListener("click", () => {
  herAddForm.classList.remove("show");
  herAddCountInput.value = "1";
});

herConfirmBtn.addEventListener("click", async () => {
  const count = parseInt(herAddCountInput.value);
  
  if (isNaN(count) || count <= 0) {
    showStatus("请输入有效的次数", "error", "her");
    return;
  }
  
  if (count > 100) {
    showStatus("单次最多增加100次", "error", "her");
    return;
  }
  
  herAddForm.classList.remove("show");
  await addMassageCount(count, "her");
  herAddCountInput.value = "1";
});

herUseBtn.addEventListener("click", async () => {
  if (herMassageData.remainingCount <= 0) {
    showStatus("没有剩余按摩次数了！", "error", "her");
    return;
  }
  
  const confirmed = confirm(`确认使用一次按摩吗？\n剩余次数: ${herMassageData.remainingCount}`);
  if (confirmed) {
    await useMassageCount("her");
  }
});

herAddCountInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    herConfirmBtn.click();
  }
});

// 点击卡片外部关闭表单
document.addEventListener("click", (e) => {
  if (!myAddForm.contains(e.target) && !myAddBtn.contains(e.target)) {
    myAddForm.classList.remove("show");
  }
  if (!herAddForm.contains(e.target) && !herAddBtn.contains(e.target)) {
    herAddForm.classList.remove("show");
  }
});

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", init);