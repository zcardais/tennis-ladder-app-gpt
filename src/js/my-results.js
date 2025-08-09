import { auth, db } from '../firebase-setup.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query } from 'firebase/firestore';
import { format } from 'date-fns';

const matchList = document.getElementById('match-list');
const ladderFilter = document.getElementById('ladderFilter');

let allMatches = [];
let playerMap = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const uid = user.uid;

  try {
    const matchesRef = collection(db, "matches");
    const q = query(matchesRef);
    const snapshot = await getDocs(q);

    // Fetch players to map UID to names
    const playersRef = collection(db, 'players');
    const playerSnapshot = await getDocs(playersRef);
    playerMap = {};
    playerSnapshot.forEach(doc => {
      const data = doc.data();
      playerMap[doc.id] = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    });

    console.log("✅ Logged-in UID:", uid);
    console.log("📦 Raw match docs:");

    snapshot.docs.forEach(doc => {
      console.log(doc.data());
    });

    // Filter matches involving the logged-in user
    allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    allMatches = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(match => match.players && match.players.includes(uid));

    populateLadderFilter();
    renderMatches(allMatches);
  } catch (error) {
    console.error("Error loading matches:", error);
  }
});

function populateLadderFilter() {
  const ladders = [...new Set(allMatches.map(m => m.ladderName))];
  ladders.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    ladderFilter.appendChild(option);
  });

  ladderFilter.addEventListener('change', () => {
    const selected = ladderFilter.value;
    const filtered = selected === 'all'
      ? allMatches
      : allMatches.filter(m => m.ladderName === selected);
    renderMatches(filtered);
  });
}

function renderMatches(matches) {
  matchList.innerHTML = '';

  if (matches.length === 0) {
    matchList.innerHTML = '<p class="text-white">No matches found.</p>';
    return;
  }

  matches.forEach(match => {
    const div = document.createElement('div');
    div.className = 'bg-white rounded shadow p-4';

    const date = match.datePlayed
      ? format(new Date(match.datePlayed.seconds * 1000), 'PPpp')
      : 'Date unknown';

    const [player1, player2] = match.players || [];
    const userUid = auth.currentUser?.uid;
    const opponentUid = player1 === userUid ? player2 : player1;
    const opponentName = playerMap[opponentUid] || 'Unknown Opponent';
    const result = match.loser === userUid ? 'L' : 'W';

    const sets = match.score?.sets || [];
    const setScores = sets.map(set => `${set.you}-${set.them}`).join(', ');

    div.innerHTML = `
      <div class="font-semibold text-lg">Opponent: ${opponentName}</div>
      <div class="text-sm text-gray-500">${date}</div>
      <div class="text-md mt-2 font-medium">${result} ${setScores}</div>
    `;

    matchList.appendChild(div);
  });
}