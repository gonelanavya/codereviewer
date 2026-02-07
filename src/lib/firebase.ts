import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0SXWgF6tBb8Zk8SBIq3G_ciYtItCzBJ4",
  authDomain: "ai-code-review1.firebaseapp.com",
  projectId: "ai-code-review1",
  storageBucket: "ai-code-review1.firebasestorage.app",
  messagingSenderId: "1053103528242",
  appId: "1:1053103528242:web:1eab47d25b52fcc74f1f2b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
