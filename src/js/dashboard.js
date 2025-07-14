// Add dashboard-specific logic here
import { db } from '../firebase-setup.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase-setup.js';
import { onAuthStateChanged } from 'firebase/auth';

export async function init() {
  console.log("Dashboard loaded");

  const laddersList = document.getElementById('joined-ladders');

  async function fetchJoinedLadders(uid) {
    let ladderCount = 0;
    try {
      const querySnapshot = await getDocs(collection(db, 'ladders'));
      let hasLadders = false;
      let joinedAny = false;

      querySnapshot.forEach((doc) => {
        const ladder = doc.data();
        const participants = ladder.participants || [];

        if (participants.includes(uid)) {
          ladderCount++;
          hasLadders = true;
          joinedAny = true;

          const ladderDiv = document.createElement('div');
          ladderDiv.className = 'bg-white text-gray-800 rounded-xl shadow p-4';

          ladderDiv.innerHTML = `
            <h2 class="text-lg font-bold mb-1">${ladder.name}</h2>
            <p class="text-sm text-gray-600 mb-1">${ladder.startDate} – ${ladder.endDate}</p>
            <div class="flex flex-col space-y-1">
              <a href="ladder.html?ladderId=${doc.id}" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                View Ladder
              </a>
              <a href="create-challenge.html?ladderId=${doc.id}" class="inline-block bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition text-sm text-center">
                Issue Challenge
              </a>
            </div>
          `;
          laddersList.appendChild(ladderDiv);
        }
      });

      document.getElementById('stat-ladders').textContent = ladderCount;

      if (!hasLadders) {
        laddersList.innerHTML = `
          <div class="text-center text-white/70 py-8">
            You are not part of any ladders.
          </div>
        `;
      } else {
        // window.location.href = "challenges.html";
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

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '/auth.html';
      return;
    }

    const uid = user.uid;
    const playerRef = doc(db, 'players', uid);
    const playerSnap = await getDoc(playerRef);
    if (playerSnap.exists()) {
      const player = playerSnap.data();
      const displayName = `${player.firstName} ${player.lastName}`;
      document.getElementById('user-name').textContent = displayName;
      fetchJoinedLadders(uid);
    }
  });
}