// src/js/auth.js
import { auth, db } from '../firebase-setup.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// SIGN UP
document.getElementById('signup-button').addEventListener('click', async () => {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      email,
      createdAt: new Date().toISOString()
    });

    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch (err) {
    alert(err.message);
  }
});

// LOGIN
document.getElementById('login-button').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    alert(`Welcome back, ${userCred.user.email}`);
    window.location.href = '/dashboard.html';
  } catch (err) {
    alert(err.message);
  }
});

// SESSION CHECK
onAuthStateChanged(auth, async user => {
  if (user) {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    console.log('Current User:', docSnap.exists() ? docSnap.data() : 'No doc found');
  } else {
    console.log('No user signed in');
  }
});