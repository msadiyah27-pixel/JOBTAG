import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getReactNativePersistence, 
  initializeAuth, 
  getAuth, 
  browserLocalPersistence // Import ini untuk cadangan di Web
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native'; // Import Platform untuk cek environment
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDSaSfZrjSca7UD0Ut-JiW8lNF9q8ltfLE",
  authDomain: "jobtag-6013d.firebaseapp.com",
  projectId: "jobtag-6013d",
  storageBucket: "jobtag-6013d.firebasestorage.app",
  messagingSenderId: "611159069468",
  appId: "1:611159069468:web:b22c072b1343074b3c60d9",
  measurementId: "G-7E3NRCRMNX"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  // Cek apakah aplikasi berjalan di Web atau Native
  const persistenceMode = Platform.OS === 'web' 
    ? browserLocalPersistence 
    : getReactNativePersistence(AsyncStorage);

  auth = initializeAuth(app, {
    persistence: persistenceMode,
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;