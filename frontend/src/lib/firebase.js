// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2VucscsjZS0C1gxzXXVJxvcA8hDmHGGY",
  authDomain: "budgetplanner-3b45c.firebaseapp.com",
  projectId: "budgetplanner-3b45c",
  storageBucket: "budgetplanner-3b45c.firebasestorage.app",
  messagingSenderId: "672592938482",
  appId: "1:672592938482:web:414f667a629791fb24176b",
  measurementId: "G-JW114WE8F6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
