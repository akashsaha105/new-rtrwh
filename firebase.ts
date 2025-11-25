// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage} from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAftOL0C6PCSs8X3qQu3vnDfFrNbHK3A2c",
//   authDomain: "rtrwh-70186.firebaseapp.com",
//   projectId: "rtrwh-70186",
//   storageBucket: "rtrwh-70186.firebasestorage.app",
//   messagingSenderId: "201611531946",
//   appId: "1:201611531946:web:6d3a9062ffe74c1bd3e2d3",
//   measurementId: "G-GTS4B8L5YZ"
// };

const firebaseConfig = {
  apiKey: "AIzaSyCCmtS_8pZRx-hpVFQE-jPo_jX_L1MufUw",
  authDomain: "new-rtrwh.firebaseapp.com",
  projectId: "new-rtrwh",
  storageBucket: "new-rtrwh.firebasestorage.app",
  messagingSenderId: "222873687294",
  appId: "1:222873687294:web:e0bbff5cf83661b566c1af",
  measurementId: "G-2THHFNLHV0",
}; 

// const firebaseConfig = {
//   apiKey: "AIzaSyDogSl5YZG7Jl4R--8DIETQwCXlbfddpYg",
//   authDomain: "jalyantra-726c8.firebaseapp.com",
//   projectId: "jalyantra-726c8",
//   storageBucket: "jalyantra-726c8.firebasestorage.app",
//   messagingSenderId: "394457781888",
//   appId: "1:394457781888:web:dc460a445f742ad4bf3865",
//   measurementId: "G-XKEJ5PB6ZL"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// export const analytics = getAnalytics(app);
