// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyATByXxkWxq1FRX5sLZgJA8ArX_VHSNATM",
  authDomain: "zhouyihe-birthday.firebaseapp.com",
  projectId: "zhouyihe-birthday",
  storageBucket: "zhouyihe-birthday.firebasestorage.app",
  messagingSenderId: "602917163291",
  appId: "1:602917163291:web:4419834d2d7d29a22903be",
  measurementId: "G-KW2LDCM21C"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app, "zhouyihe-birthday.firebasestorage.app");
