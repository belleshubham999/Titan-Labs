import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyADA3Dx1ZUE7pABkfPHPTxiEXjpbJBjGDY',
  authDomain: 'titan-lab.firebaseapp.com',
  projectId: 'titan-lab',
  storageBucket: 'titan-lab.firebasestorage.app',
  messagingSenderId: '515649086738',
  appId: '1:515649086738:web:cee03cfbf0bb75aef77fcb',
  measurementId: 'G-JWXRV0NVD1',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
