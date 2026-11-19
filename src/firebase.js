// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDS5amI7CFK1hoCOmS7VWk03v6y-dSgcsU",
  authDomain: "rt-burpers-web.firebaseapp.com",
  projectId: "rt-burpers-web",
  storageBucket: "rt-burpers-web.firebasestorage.app",
  messagingSenderId: "504397848930",
  appId: "1:504397848930:web:6a7d5de146f648c6a88c3b",
  measurementId: "G-HK80KC860G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);