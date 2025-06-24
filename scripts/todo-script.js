import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 元素选择
const addTaskBtn = document.getElementById("addTaskBtn");
const taskInput = document.getElementById("todoInput");
const taskList = document.getElementById("todoList");

// 密码提示（可自定义）
const correctPassword = "tianwanggaidihu"; // 安全词拼音版本

// 添加任务
addTaskBtn.addEventListener("click", async () => {
  const text = taskInput.value.trim();
  if (!text) return alert("请输入一个任务");

  // 弹出密码框
  const password = prompt("请输入我们的密码：");

  if (password !== correctPassword) {
    alert(password ? "哎呀，记错啦～再想想？" : "必须输入拼音！");
    return;
  }

  try {
    await addDoc(collection(db, "todo-list"), {
      text,
      completed: false,
      createdAt: serverTimestamp(),
      password: password, // 发送到数据库中校验
    });
    taskInput.value = "";
  } catch (e) {
    console.error("添加失败", e);
    alert("添加失败，请重试！");
  }
});

// 渲染任务列表
onSnapshot(collection(db, "todo-list"), (snapshot) => {
  taskList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = data.text;
    li.style.textDecoration = data.completed ? "line-through" : "none";
    li.className = data.completed ? "completed" : "";

    // 点击切换完成状态
    li.addEventListener("click", async () => {
      await updateDoc(doc(db, "todo-list", docSnap.id), {
        completed: !data.completed,
      });
    });

    // 右键删除
    li.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      if (confirm("确定要删除这项任务吗？")) {
        await deleteDoc(doc(db, "todo-list", docSnap.id));
      }
    });

    taskList.appendChild(li);
  });
});
