// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAy7dAerWYjt6xOM-Z7ky7Teaqj2xFaFc",
  authDomain: "ordermanagementsystem-d5335.firebaseapp.com",
  databaseURL: "https://ordermanagementsystem-d5335-default-rtdb.firebaseio.com",
  projectId: "ordermanagementsystem-d5335",
  storageBucket: "ordermanagementsystem-d5335.firebasestorage.app",
  messagingSenderId: "89532875755",
  appId: "1:89532875755:web:80e1986c61f8bbcc6dcfae",
  measurementId: "G-KR40RB5RLM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

import { getDatabase } from "firebase/database";

export const database = getDatabase(app);
