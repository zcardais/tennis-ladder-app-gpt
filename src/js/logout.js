// src/js/logout.js
import { auth } from '../firebase-setup.js';
import { signOut } from 'firebase/auth';

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = '/auth.html';
    }).catch(err => {
      alert('Error signing out: ' + err.message);
    });
  });
}