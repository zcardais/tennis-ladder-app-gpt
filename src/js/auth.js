import { auth, db } from '../firebase-setup.js';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

const urlParams = new URLSearchParams(window.location.search);
const inviteId = urlParams.get('inviteId');

if (inviteId) {
  const inviteRef = doc(db, 'ladderInvites', inviteId);
  getDoc(inviteRef).then((docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('firstName').value = data.firstName || '';
      document.getElementById('lastName').value = data.lastName || '';
      document.getElementById('username').value = data.username || '';
      document.getElementById('email').value = data.email || '';
    } else {
      alert('Invalid or expired invite link.');
    }
  });
}

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const status = document.getElementById('status');

  if (password !== confirmPassword) {
    status.textContent = '❌ Passwords do not match.';
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const playerDoc = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      username: document.getElementById('username').value.trim(),
      email,
      createdAt: serverTimestamp(),
    };

    if (inviteId) {
      const inviteRef = doc(db, 'ladderInvites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      if (inviteSnap.exists()) {
        const invite = inviteSnap.data();
        playerDoc.ladders = invite.ladders || [];
        for (const ladderId of invite.ladders || []) {
          const ladderRef = doc(db, 'ladders', ladderId);
          await updateDoc(ladderRef, {
            participants: arrayUnion(uid),
          });
        }
        await updateDoc(inviteRef, { status: 'accepted', acceptedAt: serverTimestamp() });
      }
    }

    await setDoc(doc(db, 'players', uid), playerDoc);
    status.textContent = '✅ Account created! Redirecting...';
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
  } catch (err) {
    console.error('Error creating user:', err);
    status.textContent = `❌ ${err.message}`;
  }
});