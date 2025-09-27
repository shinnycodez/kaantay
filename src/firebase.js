// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';



const firebaseConfig = {
  apiKey: "AIzaSyBD6y7zv9P5j7f7DuYYhDzIGnrxB7ulmrQ",
  authDomain: "kaantay-9cbcd.firebaseapp.com",
  projectId: "kaantay-9cbcd",
  storageBucket: "kaantay-9cbcd.firebasestorage.app",
  messagingSenderId: "80475010763",
  appId: "1:80475010763:web:2a5486ff9f73802b508d4e",
  measurementId: "G-V243YE5NB2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Export the db
export { db };