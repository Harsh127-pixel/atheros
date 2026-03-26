import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBhj4KbYH5grJN2amoSPCPinNJGc452gwo",
  authDomain: "atheros-15d2e.firebaseapp.com",
  projectId: "atheros-15d2e",
  storageBucket: "atheros-15d2e.firebasestorage.app",
  messagingSenderId: "221559285804",
  appId: "1:221559285804:web:a6ba496d8d533ebae50989",
  measurementId: "G-YMYNR508XH"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
