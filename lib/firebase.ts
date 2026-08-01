import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7TgjwLdv4c04FEyNQYkUWv0jCyXgRBhk",
  authDomain: "ndi-ai.firebaseapp.com",
  projectId: "ndi-ai",
  storageBucket: "ndi-ai.firebasestorage.app",
  messagingSenderId: "773170874872",
  appId: "1:773170874872:web:f186b19725ad31ad0cee0d",
  measurementId: "G-0TWTYSKRND",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);