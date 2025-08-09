import { db } from '../firebase-setup.js';
window.db = db;
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
window.firestore = { collection, getDocs, query, orderBy, doc, getDoc, updateDoc };

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📅 Matches view loaded');
  const matchList = document.getElementById('match-list');
  if (!matchList) return;

  matchList.innerHTML = '<p class="text-white/80">Loading matches...</p>';

  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, orderBy('datePlayed', 'desc'));
    const snapshot = await getDocs(q);

    const playersSnapshot = await getDocs(collection(db, 'players'));
    const playerMap = {};
    playersSnapshot.forEach(doc => {
      const { firstName, lastName } = doc.data();
      playerMap[doc.id] = `${firstName} ${lastName}`.trim();
    });

    if (snapshot.empty) {
      matchList.innerHTML = '<p class="text-white/80">No matches reported yet.</p>';
      return;
    }

    // Collect matches and unique ladders
    const allMatches = [];
    const ladderMap = new Map();

    snapshot.forEach(doc => {
      const match = { id: doc.id, ...doc.data() };
      allMatches.push(match);

      if (match.ladderId && match.ladderName) {
        ladderMap.set(match.ladderId, match.ladderName);
      }
    });

    // Populate dropdown
    const ladderFilter = document.getElementById('ladderFilter');
    if (ladderFilter) {
      // Clear previous options except 'all'
      ladderFilter.innerHTML = '';
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'All Ladders';
      ladderFilter.appendChild(allOption);
      ladderMap.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        ladderFilter.appendChild(option);
      });
    }

    // Filtered render
    function renderMatches(filteredMatches) {
      matchList.innerHTML = '';
      const seenChallengeIds = new Set();

      filteredMatches.forEach(match => {
        if (seenChallengeIds.has(match.challengeId)) return;
        seenChallengeIds.add(match.challengeId);

        const date = match.datePlayed?.toDate().toLocaleDateString() || 'Unknown Date';
        const players = match.players?.map(uid => playerMap[uid] || uid) || ['?', '?'];
        const score = Array.isArray(match.score?.sets)
          ? match.score.sets
              .filter(set => !(set.you === 0 && set.them === 0))
              .map(set => {
                const you = set?.you ?? '?';
                const them = set?.them ?? '?';
                return `${you}–${them}`;
              })
              .join(', ')
          : 'No score';
        const winner = playerMap[match.winner] || match.winner || 'N/A';
        const ladder = match.ladderName || 'Unknown Ladder';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-md p-4';
        card.innerHTML = `
          <div class="text-sm text-gray-500 mb-1">${date} • ${ladder}</div>
          <div class="font-semibold">${players[0]} vs ${players[1]}</div>
          <div class="text-gray-700">Score: <span class="font-medium">${score}</span></div>
          <div class="text-green-600 font-medium mt-1">Winner: ${winner}</div>
        `;
        matchList.appendChild(card);
      });
    }

    // Initial render (all)
    renderMatches(allMatches);

    // Re-render on filter change
    if (ladderFilter) {
      ladderFilter.addEventListener('change', () => {
        const selected = ladderFilter.value;
        const filtered = selected === 'all'
          ? allMatches
          : allMatches.filter(m => m.ladderId === selected);
        renderMatches(filtered);
      });
    }
  } catch (error) {
    console.error('Error fetching matches:', error);
    matchList.innerHTML = '<p class="text-red-500">Failed to load matches.</p>';
  }
});