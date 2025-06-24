// todo-script.js
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const input = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("todoList");

async function loadTodos() {
  const q = query(collection(db, "todoList"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = createTodoItem(docSnap.id, data.text, data.done, data.createdAt?.toDate());
    list.appendChild(li);
  });
}

function createTodoItem(id, text, done, date) {
  const li = document.createElement("li");
  if (done) li.classList.add("done");

  const span = document.createElement("span");
  span.className = "todo-text";
  span.textContent = text;
  span.onclick = async () => {
    li.classList.toggle("done");
    await updateDoc(doc(db, "todoList", id), {
      done: li.classList.contains("done")
    });
  };

  const dateSpan = document.createElement("span");
  dateSpan.className = "todo-date";
  dateSpan.textContent = date ? `添加于 ${date.toLocaleDateString()}` : "";

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "删除";
  del.onclick = async () => {
    await deleteDoc(doc(db, "todoList", id));
    li.remove();
  };

  li.appendChild(span);
  li.appendChild(dateSpan);
  li.appendChild(del);
  return li;
}

addBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  const docRef = await addDoc(collection(db, "todoList"), {
    text,
    done: false,
    createdAt: serverTimestamp()
  });

  const li = createTodoItem(docRef.id, text, false, new Date());
  list.prepend(li);
  input.value = "";
};

loadTodos();
