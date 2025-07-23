import { db } from '../firebase-setup.js';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-member-form');
  const statusMessageDiv = document.getElementById('status-message');
  const cancelBtn = document.getElementById('cancelBtn');

  cancelBtn.addEventListener('click', () => {
    window.location.href = 'players.html';
  });

  // Quick Add to Ladders: load active ladders into the form
  async function loadActiveLadders() {
    const laddersRef = collection(db, 'ladders');
    const qLadders = query(laddersRef, where('status', '==', 'active'));
    const snapL = await getDocs(qLadders);
    const container = document.getElementById('laddersCheckboxes');
    snapL.forEach(docSnap => {
      const { name } = docSnap.data();
      const id = docSnap.id;
      const wrapper = document.createElement('label');
      wrapper.className = 'flex items-center space-x-2';
      wrapper.innerHTML = `
        <input type="checkbox" name="ladders" value="${id}" class="h-4 w-4 text-indigo-600" />
        <span>${name}</span>
      `;
      container.appendChild(wrapper);
    });
  }
  loadActiveLadders();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusMessageDiv.classList.add('hidden');

    const email = form.email.value.trim().toLowerCase();
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const phoneNumber = form.phoneNumber.value.trim();
    const utr = parseFloat(form.utr.value);

    // Simple validation
    if (!email || !firstName || !lastName || !phoneNumber || isNaN(utr)) {
      statusMessageDiv.textContent = 'All fields are required.';
      statusMessageDiv.classList.remove('hidden');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      const playersRef = collection(db, 'players');
      const q = query(playersRef, where('email', '==', email));
      const snap = await getDocs(q);

      let userId;
      if (snap.empty) {
        // Create new player with a pending invite
        const newPlayerRef = doc(playersRef);
        userId = newPlayerRef.id;
        await setDoc(newPlayerRef, {
          email,
          firstName,
          lastName,
          phoneNumber,
          utr,
          username: email,
          inviteId: new Date().toISOString(),
          status: "pending",
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing player
        userId = snap.docs[0].id;
        const playerRef = doc(db, 'players', userId);
        await updateDoc(playerRef, {
          firstName,
          lastName,
          phoneNumber,
          utr
        });
      }

      // Assign new member to selected ladders
      const selectedLadders = Array.from(
        form.querySelectorAll("input[name='ladders']:checked")
      ).map(cb => cb.value);
      for (const ladderId of selectedLadders) {
        const ladderRef = doc(db, "ladders", ladderId);
        await updateDoc(ladderRef, {
          participants: arrayUnion(userId)
        });
      }

      statusMessageDiv.textContent = '✅ Member added successfully.';
      statusMessageDiv.classList.remove('hidden');

      // Redirect back to the Club Roster after a short delay
      setTimeout(() => {
        window.location.href = 'players.html';
      }, 1000);
    } catch (error) {
      console.error(error);
      statusMessageDiv.textContent = '❌ Error: ' + error.message;
      statusMessageDiv.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Member';
    }
  });
});

// Export an init function for dynamic imports
export function init() {
  // No-op: script already initializes on DOMContentLoaded
}