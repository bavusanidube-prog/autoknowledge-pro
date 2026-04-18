import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBD1TFfCDnqP1VYwskBu-Qd9AROWL0TOSk",
  authDomain: "autoknowledge-pro.firebaseapp.com",
  projectId: "autoknowledge-pro",
  storageBucket: "autoknowledge-pro.firebasestorage.app",
  messagingSenderId: "476847258960",
  appId: "1:476847258960:web:2898e7d7968d8ba84b8055"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signupUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function saveReport(report) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to save a report.");

  await addDoc(collection(db, "reports"), {
    userId: user.uid,
    email: user.email,
    fault: report.fault,
    confidence: report.confidence,
    explanation: report.explanation,
    steps: report.steps,
    createdAt: serverTimestamp()
  });
}

export async function getMyReports() {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to view reports.");

  const reportsQuery = query(
    collection(db, "reports"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
}