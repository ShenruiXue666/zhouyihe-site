import { db, storage } from "../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const addTaskBtn = document.getElementById("addTaskBtn");
const taskInput = document.getElementById("todoInput");
const memoryImageInput = document.getElementById("memoryImageInput");
const activeList = document.getElementById("activeList");
const doneList = document.getElementById("doneList");

// 添加任务
addTaskBtn.addEventListener("click", async () => {
  const text = taskInput.value.trim();
  if (!text) return alert("请输入一个任务");

  try {
    await addDoc(collection(db, "todo-list"), {
      text,
      completed: false,
      createdAt: serverTimestamp(),
    });
    taskInput.value = "";
  } catch (e) {
    console.error("添加失败", e);
    alert("添加失败，请重试！");
  }
});

// 渲染任务列表
const q = query(collection(db, "todo-list"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  activeList.innerHTML = "";
  doneList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.classList.toggle("done", data.completed);

    const meta = document.createElement("div");
    meta.className = "todo-meta";

    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = data.text;
    span.addEventListener("click", async () => {
      if (!data.completed) {
        memoryImageInput.click();
        memoryImageInput.onchange = async () => {
          const file = memoryImageInput.files[0];
          let memoryImageUrl = "";
          if (file) {
            const imageName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `memory-images/${imageName}`);
            await uploadBytes(storageRef, file);
            memoryImageUrl = await getDownloadURL(storageRef);
          }
          await updateDoc(doc(db, "todo-list", docSnap.id), {
            completed: true,
            memoryImageUrl,
          });
        };
      } else {
        await updateDoc(doc(db, "todo-list", docSnap.id), {
          completed: false,
        });
      }
    });

    const date = data.createdAt?.toDate();
    const dateSpan = document.createElement("span");
    dateSpan.className = "todo-date";
    if (date) {
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      dateSpan.textContent = dateStr;
    }

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "🗑";
    delBtn.addEventListener("click", async () => {
      if (confirm("确定要删除这项任务吗？")) {
        await deleteDoc(doc(db, "todo-list", docSnap.id));
      }
    });

    meta.appendChild(span);
    meta.appendChild(dateSpan);
    meta.appendChild(delBtn);
    li.appendChild(meta);

    // 如果有纪念图
    if (data.memoryImageUrl) {
      const img = document.createElement("img");
      img.src = data.memoryImageUrl;
      img.className = "memory-img";
      img.alt = "纪念图";
      li.appendChild(img);
    }

    if (data.completed) {
      doneList.appendChild(li);
    } else {
      activeList.appendChild(li);
    }
  });
});
