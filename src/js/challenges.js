import { db } from './firebase-setup.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

console.log("Challenges.js loaded");

const loggedInPlayerId = 'tyler'; // Replace with dynamic user ID later

// Elements for tabs
const pendingTab = document.getElementById('pending-list');
const sentTab = document.getElementById('sent-list');
const historyTab = document.getElementById('history-list');

// Fetch all challenges for the user
export async function init() {
  try {
    const q = query(
      collection(db, 'challenges'),
      where('participants', 'array-contains', loggedInPlayerId) // Assuming you store participants: [challenger, opponent]
    );
    const querySnapshot = await getDocs(q);

    const pending = [];
    const sent = [];
    const history = [];

    querySnapshot.forEach((doc) => {
      const challenge = doc.data();
      challenge.id = doc.id;

      if (challenge.status === 'pending') {
        if (challenge.opponent === loggedInPlayerId) {
          pending.push(challenge);
        } else if (challenge.challenger === loggedInPlayerId) {
          sent.push(challenge);
        }
      } else if (challenge.status === 'completed') {
        history.push(challenge);
      }
    });

    renderTab(pendingTab, pending, 'pending');
    renderTab(sentTab, sent, 'sent');
    renderTab(historyTab, history, 'history');

  } catch (error) {
    console.error('Error fetching challenges:', error);
  }
}

function renderTab(container, challenges, type) {
  container.innerHTML = ''; // Clear previous

  if (challenges.length === 0) {
    container.innerHTML = `<p class="text-blue-200 text-center">No ${type} challenges</p>`;
    return;
  }

  challenges.forEach(challenge => {
    const item = document.createElement('div');
    item.className = 'bg-white text-black rounded-lg p-3 shadow';

    let content = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold">${challenge.challenger} vs ${challenge.opponent}</p>
          <p class="text-sm text-gray-600">${challenge.dateIssued}</p>
        </div>
    `;

    if (type === 'pending' && challenge.opponent === loggedInPlayerId) {
      content += `
        <div class="flex space-x-2">
          <button class="accept-btn bg-green-500 text-white px-2 py-1 rounded" data-id="${challenge.id}">Accept</button>
          <button class="deny-btn bg-red-500 text-white px-2 py-1 rounded" data-id="${challenge.id}">Deny</button>
        </div>
      `;
    } else if (type === 'history') {
      content += `
        <div class="text-right">
          <p class="text-sm">${challenge.result}</p>
        </div>
      `;
    }

    content += '</div>';
    item.innerHTML = content;
    container.appendChild(item);
  });
}