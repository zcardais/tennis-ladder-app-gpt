// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxA8WgCWmB9azIssQyhVXb_25UwzahqGw",
  authDomain: "tennis-ladder-app.firebaseapp.com",
  projectId: "tennis-ladder-app",
  storageBucket: "tennis-ladder-app.firebasestorage.app",
  messagingSenderId: "998277642882",
  appId: "1:998277642882:web:6ec2cc3b38bb56fbd9929b"
};

const app = initializeApp(firebaseConfig);

// Optional: initialize Firestore and Auth here if needed
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Export app so other modules can use it
export { app, db, auth };
export { firebaseConfig };