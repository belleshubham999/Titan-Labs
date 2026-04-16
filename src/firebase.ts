import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'your api key',
  authDomain: 'titan-lab.firebaseapp.com',
  projectId: 'titan-lab',
  storageBucket: 'titan-lab.firebasestorage.app',
  messagingSenderId: 'your-id',
  appId: 'your-app-id',
  measurementId: 'your-measurement-id',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
