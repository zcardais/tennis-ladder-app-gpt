// src/js/logout.js
import { auth } from '../firebase-setup.js';
import { signOut } from 'firebase/auth';

// Avoid double-binding if this script is included multiple times
if (!window.__logoutBound) {
  window.__logoutBound = true;

  function isLogoutTarget(el) {
    return !!(
      el && (
        el.closest('#logoutBtn') ||           // preferred id
        el.closest('#logout-button') ||       // legacy id
        el.closest('[data-action="logout"]') ||
        el.closest('[data-logout]')
      )
    );
  }

  // Use event delegation so buttons added later also work
  document.addEventListener(
    'click',
    (e) => {
      if (isLogoutTarget(e.target)) {
        e.preventDefault();
        signOut(auth)
          .then(() => {
            window.location.href = '/auth.html';
          })
          .catch((err) => {
            console.error('Error signing out:', err);
            alert('Error signing out: ' + err.message);
          });
      }
    },
    { capture: true }
  );
}