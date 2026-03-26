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

import { getAnalytics, isSupported } from 'firebase/analytics';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics is only for browser
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { auth, googleProvider, analytics };
