// src/js/protect.js
import { auth } from '../firebase-setup.js';
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, user => {
  if (!user) {
    // Not signed in → redirect to login
    window.location.href = '/auth.html';
  }
});