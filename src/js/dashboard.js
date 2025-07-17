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
          // Update className as instructed
          ladderDiv.className = 'bg-white rounded-xl shadow p-4';

          // Calculate days remaining
          const endDateObj = new Date(ladder.endDate);
          const today = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;
          const daysLeft = Math.max(0, Math.ceil((endDateObj - today) / msPerDay));

          ladderDiv.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-3">
        <!-- Example icon, replace or adjust SVG as needed -->
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10l9-9m0 0l9 9m-9-9v18"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800">${ladder.name}</h2>
          <p class="text-sm text-gray-500">${ladder.description}</p>
        </div>
      </div>
    </div>
    <div class="flex justify-between text-center text-sm text-gray-700 mb-2">
      <div>
        <p class="text-lg font-bold text-blue-600">#${ladder.mockRank || '–'}</p>
        <p class="text-xs text-gray-500">Your Rank</p>
      </div>
      <div>
        <p class="text-lg font-bold text-blue-600">${ladder.mockRating || '–'}</p>
        <p class="text-xs text-gray-500">Rating</p>
      </div>
      <div>
        <p class="text-lg font-bold text-blue-600">${ladder.mockRecord || '–'}</p>
        <p class="text-xs text-gray-500">Record</p>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center text-sm text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
        </svg>
        <span>Ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}</span>
      </div>
      <a href="ladder.html?ladderId=${doc.id}" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        View Ladder
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