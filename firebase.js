import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ========================
// 🔥 YOUR FIREBASE CONFIG
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyBD1TFfCDnqP1VYwskBu-Qd9AROWL0TOSk",
  authDomain: "autoknowledge-pro.firebaseapp.com",
  projectId: "autoknowledge-pro",
  storageBucket: "autoknowledge-pro.firebasestorage.app",
  messagingSenderId: "476847258960",
  appId: "1:476847258960:web:2898e7d7968d8ba84b8055"
};

// ========================
// INIT FIREBASE
// ========================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================
// 🔐 AUTH FUNCTIONS
// ========================
window.signup = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert("Account created successfully"))
    .catch(err => alert(err.message));
};

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => alert("Login successful"))
    .catch(err => alert(err.message));
};

// Show login status
onAuthStateChanged(auth, user => {
  const status = document.getElementById("userStatus");
  if (status) {
    status.innerText = user
      ? "Logged in: " + user.email
      : "Not logged in";
  }
});

// ========================
// 💾 SAVE DIAGNOSTIC REPORT
// ========================
window.saveReport = async function (report) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  try {
    await addDoc(collection(db, "reports"), {
      userId: user.uid,
      email: user.email,
      fault: report.fault,
      confidence: report.confidence,
      steps: report.steps,
      created: new Date().toISOString()
    });

    alert("Report saved to Firebase ☁️");
  } catch (e) {
    alert("Error saving report: " + e.message);
  }
};