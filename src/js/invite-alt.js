import { db } from '../firebase-setup.js';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

export function init() {
  const onReady = async () => {
    console.log("✅ invite-alt.js loaded");

    const form = document.getElementById('invite-form');
    const status = document.getElementById('status');

    if (!form || !status) {
      console.error("❌ Form or status element not found");
      return;
    }

    const ladderContainer = document.getElementById('ladder-select');
    const laddersSnap = await getDocs(collection(db, 'ladders'));
    laddersSnap.forEach(doc => {
      const ladder = doc.data();
      const checkbox = document.createElement('div');
      checkbox.innerHTML = `
        <label class="flex items-center gap-2">
          <input type="checkbox" name="ladder" value="${doc.id}" class="accent-blue-600" />
          <span>${ladder.name || doc.id}</span>
        </label>
      `;
      ladderContainer.appendChild(checkbox);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const invite = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        ladders: Array.from(document.querySelectorAll('input[name="ladder"]:checked')).map(cb => cb.value),
        status: 'pending',
        sentAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(db, 'ladderInvites'), invite);
        const link = `${window.location.origin}/auth.html?inviteId=${docRef.id}`;
        console.log("🔗 Invite link:", link);
        form.reset();
        status.textContent = `✅ Invite sent to ${invite.email}`;
        console.log("📨 Invite sent:", invite);
      } catch (err) {
        console.error('Error sending invite:', err);
        status.textContent = '❌ Failed to send invite. Try again.';
      }
    });
  };

  if (document.readyState !== 'loading') {
    onReady();
  } else {
    window.addEventListener('DOMContentLoaded', onReady);
  }
}