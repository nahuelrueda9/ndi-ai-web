// app/paseandoporets2/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7TgjwLdv4c04FEyNQYkUWv0jCyXgRBhk",
  authDomain: "ndi-ai.firebaseapp.com",
  projectId: "ndi-ai",
  storageBucket: "ndi-ai.firebasestorage.app",
  messagingSenderId: "773170874872",
  appId: "1:773170874872:web:f186b19725ad31ad0cee0d",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
