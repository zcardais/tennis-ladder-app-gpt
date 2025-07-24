

import { db } from '../firebase-setup.js';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('playerId');
  const form = document.getElementById('edit-player-form');
  const statusMessageDiv = document.getElementById('status-message');
  const cancelBtn = document.getElementById('cancelBtn');
  const laddersContainer = document.getElementById('laddersCheckboxes');

  // Navigate back
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'players.html';
  });

  if (!playerId) {
    statusMessageDiv.textContent = '❌ No playerId provided in URL';
    statusMessageDiv.classList.remove('hidden');
    return;
  }

  // Fetch player data
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) {
    statusMessageDiv.textContent = '❌ Player not found';
    statusMessageDiv.classList.remove('hidden');
    return;
  }
  const playerData = playerSnap.data();

  // Populate form fields
  form.email.value = playerData.email || '';
  form.firstName.value = playerData.firstName || '';
  form.lastName.value = playerData.lastName || '';
  form.phoneNumber.value = playerData.phoneNumber || '';
  form.utr.value = playerData.utr || '';

  // Load active ladders and render checkboxes, checking those this player is in
  const laddersRef = collection(db, 'ladders');
  const q = query(laddersRef, where('status', '==', 'active'));
  const snapL = await getDocs(q);
  // Determine membership: ladder docs have participants array
  snapL.forEach(docSnap => {
    const { name, participants = [] } = docSnap.data();
    const id = docSnap.id;
    const wrapper = document.createElement('label');
    wrapper.className = 'flex items-center space-x-2';
    const checked = participants.includes(playerId) ? 'checked' : '';
    wrapper.innerHTML = `
      <input type="checkbox" name="ladders" value="${id}" class="h-4 w-4 text-indigo-600" ${checked} />
      <span class="ml-2">${name}</span>
    `;
    laddersContainer.appendChild(wrapper);
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusMessageDiv.classList.add('hidden');

    // Read form values
    const email = form.email.value.trim().toLowerCase();
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const phoneNumber = form.phoneNumber.value.trim();
    const utr = parseFloat(form.utr.value);

    // Validate required fields
    if (!email || !firstName || !lastName) {
      statusMessageDiv.textContent = 'Email, First Name, and Last Name are required.';
      statusMessageDiv.classList.remove('hidden');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      // Update player doc
      await updateDoc(playerRef, {
        email,
        firstName,
        lastName,
        phoneNumber,
        utr,
        updatedAt: serverTimestamp()
      });

      // Update ladder memberships
      const selected = Array.from(form.querySelectorAll("input[name='ladders']:checked")).map(cb => cb.value);
      // For each active ladder, add or remove membership
      for (const docSnap of snapL.docs) {
        const ladderId = docSnap.id;
        const ladderRef = doc(db, 'ladders', ladderId);
        const isMember = docSnap.data().participants?.includes(playerId);
        const shouldBeMember = selected.includes(ladderId);
        if (!isMember && shouldBeMember) {
          await updateDoc(ladderRef, { participants: arrayUnion(playerId) });
        } else if (isMember && !shouldBeMember) {
          await updateDoc(ladderRef, { participants: arrayRemove(playerId) });
        }
      }

      statusMessageDiv.textContent = '✅ Player updated successfully.';
      statusMessageDiv.classList.remove('hidden');
      setTimeout(() => {
        window.location.href = 'players.html';
      }, 1000);
    } catch (error) {
      console.error(error);
      statusMessageDiv.textContent = '❌ Error: ' + error.message;
      statusMessageDiv.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });
});

// Export init for dynamic import
export function init() {}