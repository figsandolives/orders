// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAAy7dAerWYjt6xOM-Z7ky7Teaqj2xFaFc",
  authDomain: "ordermanagementsystem-d5335.firebaseapp.com",
  projectId: "ordermanagementsystem-d5335",
  storageBucket: "ordermanagementsystem-d5335.firebasestorage.app",
  messagingSenderId: "89532875755",
  appId: "1:89532875755:web:80e1986c61f8bbcc6dcfae",
  measurementId: "G-KR40RB5RLM"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
