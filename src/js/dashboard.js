// Add dashboard-specific logic here
import { db, getCurrentUID } from '../firebase-setup.js';
import { collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase-setup.js';
import { onAuthStateChanged } from 'firebase/auth';

export async function init() {
  console.log("Dashboard loaded");

  const laddersList = document.getElementById('joined-ladders');

  async function fetchJoinedLadders(uid, playerId) {
    let ladderCount = 0;
    try {
      // Clear existing ladder cards to avoid duplicates
      laddersList.innerHTML = '';
      const querySnapshot = await getDocs(collection(db, 'ladders'));
      let hasLadders = false;
      let joinedAny = false;

      // Loop so we can await inside for each ladder
      for (const ladderDoc of querySnapshot.docs) {
        const ladder = ladderDoc.data();
        const participants = ladder.participants || [];
        if (!participants.includes(playerId)) continue;
        ladderCount++;
        hasLadders = true;

        // Fetch completed challenge docs for this ladder
        const challengesRef = collection(db, 'challenges');
        const challengesQuery = query(
          challengesRef,
          where('status', '==', 'completed'),
          where('ladderId', '==', ladderDoc.id)
        );
        const challengesSnap = await getDocs(challengesQuery);
        let wins = 0, losses = 0;
        challengesSnap.forEach(cDoc => {
          const data = cDoc.data();
          const sets = data.score?.sets || [];
          let userSetWins = 0;
          sets.forEach(s => {
            // if user was challenger, compare you/them; otherwise reverse
            if (data.challenger === uid) {
              if (s.you > s.them) userSetWins++;
            } else {
              if (s.them > s.you) userSetWins++;
            }
          });
          const opponentSetWins = sets.length - userSetWins;
          if (userSetWins > opponentSetWins) wins++;
          else losses++;
        });
        const recordText = `${wins}–${losses}`;

        // Calculate days remaining
        const endDateObj = new Date(ladder.endDate);
        const today = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysLeft = Math.max(0, Math.ceil((endDateObj - today) / msPerDay));

        // Compute player's actual rank in this ladder
        let rank = "–";
        if (Array.isArray(participants) && participants.length > 0) {
          const idx = participants.indexOf(playerId);
          if (idx !== -1) {
            rank = idx + 1;
          }
        }

        // Render the ladder card with live record and actual rank
        const ladderDiv = document.createElement('div');
        ladderDiv.className = 'bg-white rounded-xl shadow p-4';
        ladderDiv.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-3">
        <!-- Example icon -->
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
          <!-- SVG here -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10l9-9m0 0l9 9m-9-9v18"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800">${ladder.name}</h2>
        </div>
      </div>
    </div>
    <div class="flex justify-between text-center text-sm text-gray-700 mb-2">
      <div>
        <p class="text-lg font-bold text-blue-600">#${rank}</p>
        <p class="text-xs text-gray-500">Your Rank</p>
      </div>
      <div>
        <p class="text-lg font-bold text-blue-600">${ladder.mockRating || '–'}</p>
        <p class="text-xs text-gray-500">Rating</p>
      </div>
      <div>
        <p class="text-lg font-bold text-blue-600">${recordText}</p>
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
      <a href="ladder.html?ladderId=${ladderDoc.id}" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        View Ladder
      </a>
    </div>
        `;
        laddersList.appendChild(ladderDiv);
      }

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

  async function fetchRecentMatches(uid) {
    const matchesList = document.getElementById("recent-matches");
    matchesList.innerHTML = ""; // clear loading state

    try {
      const matchesRef = collection(db, "matches");
      const matchesQuery = query(
        matchesRef,
        where("players", "array-contains", uid),
        where("datePlayed", "!=", null),
        // Firestore doesn't support orderBy after array-contains without an index, but assume the index is created
      );
      const snapshot = await getDocs(matchesQuery);

      // Sort locally by datePlayed desc and take top 5
      const recentMatches = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.datePlayed)
        .sort((a, b) => b.datePlayed.toMillis() - a.datePlayed.toMillis())
        .slice(0, 5);

      if (recentMatches.length === 0) {
        matchesList.innerHTML = '<p class="text-sm text-white/70">No recent matches found.</p>';
        return;
      }

      for (const match of recentMatches) {
        const opponentId = match.players.find(p => p !== uid);
        const opponentDoc = await getDoc(doc(db, 'players', opponentId));
        let fullName = opponentId;
        if (opponentDoc.exists()) {
          const opponentData = opponentDoc.data();
          fullName = `${opponentData.firstName || ''} ${opponentData.lastName || ''}`.trim() || opponentId;
        }
        const result = match.winner === uid ? "Won" : "Lost";
        const score = match.score?.sets?.map(s => `${s.you}–${s.them}`).join(', ') || "Score N/A";
        const date = match.datePlayed.toDate().toLocaleDateString();

        const matchCard = document.createElement("div");
        matchCard.className = "bg-white rounded p-3 shadow text-sm";
        matchCard.innerHTML = `
          <div class="flex justify-between mb-1">
            <span class="font-medium text-gray-800">${result}</span>
            <span class="text-gray-500">${date}</span>
          </div>
          <div class="text-gray-700">vs ${fullName}</div>
          <div class="text-xs text-gray-500">${score}</div>
        `;
        matchesList.appendChild(matchCard);
      }
    } catch (error) {
      console.error("Error loading recent matches:", error);
      matchesList.innerHTML = '<p class="text-sm text-red-400">Failed to load matches.</p>';
    }
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '/auth.html';
      return;
    }

    const uid = user.uid;
    const playersQuery = query(collection(db, 'players'), where('uid', '==', uid));
    const playersSnap = await getDocs(playersQuery);

    let player;
    let playerId;
    if (!playersSnap.empty) {
      player = playersSnap.docs[0].data();
      playerId = playersSnap.docs[0].id;
    } else {
      // Auto-create player profile
      const playerData = {
        uid,
        email: user.email,
        firstName: "",
        lastName: "",
        username: "",
        rank: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'players'), playerData);
      player = playerData;
      console.log(`✅ Auto-created player profile for ${user.email}`);
    }

    const displayName = `${player.firstName} ${player.lastName}`.trim() || player.username || "Player";
    document.getElementById('user-name').textContent = displayName;

    // Reveal admin-only elements if player is admin
    if (player.isAdmin) {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.remove('hidden');
      });
    }

    // Load and display primary ladder first, if set
    const primaryLadderId = player.primaryLadderId;
    if (primaryLadderId) {
      try {
        const ladderDoc = await getDoc(doc(db, "ladders", primaryLadderId));
        if (ladderDoc.exists()) {
          const ladderData = ladderDoc.data();
          ladderData.name = ladderData.name || "Unnamed Ladder";
          ladderData.description = ladderData.description || "";
          ladderData.mockRank = ladderData.mockRank || "–";
          ladderData.mockRating = ladderData.mockRating || "–";
          ladderData.endDate = ladderData.endDate || new Date().toISOString();

          const endDateObj = new Date(ladderData.endDate);
          const today = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;
          const daysLeft = Math.max(0, Math.ceil((endDateObj - today) / msPerDay));

          const recordText = "–"; // Optionally calculate record here if needed

          const ladderDiv = document.createElement('div');
          ladderDiv.className = 'bg-white rounded-xl shadow p-4';
          ladderDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10l9-9m0 0l9 9m-9-9v18"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800">${ladderData.name}</h2>
                  <p class="text-sm text-gray-500">${ladderData.description}</p>
                </div>
              </div>
            </div>
            <div class="flex justify-between text-center text-sm text-gray-700 mb-2">
              <div>
                <p class="text-lg font-bold text-blue-600">#${ladderData.mockRank}</p>
                <p class="text-xs text-gray-500">Your Rank</p>
              </div>
              <div>
                <p class="text-lg font-bold text-blue-600">${ladderData.mockRating}</p>
                <p class="text-xs text-gray-500">Rating</p>
              </div>
              <div>
                <p class="text-lg font-bold text-blue-600">${recordText}</p>
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
              <a href="ladder.html?ladderId=${primaryLadderId}" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                View Ladder
              </a>
            </div>
          `;
          document.getElementById('joined-ladders')?.prepend(ladderDiv);
        }
      } catch (err) {
        console.error("Failed to load primary ladder:", err);
      }
    }
    fetchJoinedLadders(uid, playerId);
    fetchRecentMatches(uid);
  });
}
