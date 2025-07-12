// Add dashboard-specific logic here
import { db } from '../firebase-setup.js';
import { collection, getDocs } from 'firebase/firestore';

export function init() {
  console.log("Dashboard loaded");

  const loggedInPlayerId = 'tyler'; // Replace with real auth user later
  const laddersList = document.getElementById('joined-ladders');

  async function fetchJoinedLadders() {
    try {
      const querySnapshot = await getDocs(collection(db, 'ladders'));
      let hasLadders = false;

      querySnapshot.forEach((doc) => {
        const ladder = doc.data();
        const participants = ladder.participants || [];

        if (participants.includes(loggedInPlayerId)) {
          hasLadders = true;

          const ladderDiv = document.createElement('div');
          ladderDiv.className = 'bg-white text-gray-800 rounded-xl shadow p-4';

          ladderDiv.innerHTML = `
            <h2 class="text-lg font-bold mb-2">${ladder.name}</h2>
            <p class="text-sm text-gray-600 mb-2">${ladder.startDate} – ${ladder.endDate}</p>
            <a href="ladder.html?id=${doc.id}" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              View Ladder
            </a>
          `;
          laddersList.appendChild(ladderDiv);
        }
      });

      if (!hasLadders) {
        laddersList.innerHTML = `
          <div class="text-center text-white/70 py-8">
            You are not part of any ladders.
          </div>
        `;
      }
    } catch (error) {
      console.error("Error fetching ladders: ", error);
      laddersList.innerHTML = `
        <div class="text-center text-red-500 py-8">
          Failed to load ladders.
        </div>
      `;
    }
  }

  fetchJoinedLadders();
}