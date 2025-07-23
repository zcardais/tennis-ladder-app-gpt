import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase-setup.js";
import { onAuthStateChanged } from "firebase/auth";

console.log("Stats.js loaded");

async function loadPlayerStats(userId) {
  // Fetch player info
  const playerRef = doc(db, "players", userId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    console.error("Player not found!");
    return;
  }

  const playerData = playerSnap.data();
  // Derive full name from firstName and lastName
  const fullName = `${playerData.firstName} ${playerData.lastName}`;
  document.getElementById("player-name").innerText = fullName;
  document.getElementById("player-initials").innerText = fullName
    .split(" ")
    .map(n => n[0])
    .join("");
  document.getElementById("player-rank").innerText = `#${playerData.rank}`;
  document.getElementById("player-record").innerText = playerData.record;

  // Fetch all completed challenges and filter for this user
  const challengesQuery = query(
    collection(db, "challenges"),
    where("status", "==", "completed")
  );
  const challengesSnap = await getDocs(challengesQuery);

  let wins = 0, losses = 0;
  const recentMatches = [];

  challengesSnap.forEach(cDoc => {
    const data = cDoc.data();
    // Only process matches the user played
    if (data.challenger === userId || data.opponent === userId) {
      const sets = data.score?.sets || [];
      // Count sets won by user
      let userSetWins = 0;
      sets.forEach(s => {
        if (data.challenger === userId) {
          if (s.you > s.them) userSetWins++;
        } else {
          if (s.them > s.you) userSetWins++;
        }
      });
      const opponentSetWins = sets.length - userSetWins;
      if (userSetWins > opponentSetWins) wins++;
      else losses++;
      recentMatches.push(data);
    }
  });

  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : "--";

  document.getElementById("total-wins").innerText = wins;
  document.getElementById("total-losses").innerText = losses;
  document.getElementById("win-rate").innerText = `${winRate}%`;

  // === Challenge Activity ===
  const sentQuery = query(
    collection(db, "challenges"),
    where("challenger", "==", userId)
  );
  const recQuery = query(
    collection(db, "challenges"),
    where("opponent", "==", userId)
  );
  const sentSnap = await getDocs(sentQuery);
  const recSnap = await getDocs(recQuery);
  const sentCount = sentSnap.size;
  const recCount  = recSnap.size;
  document.getElementById("ch-sent").textContent     = sentCount;
  document.getElementById("ch-received").textContent = recCount;
  const successSentCount = sentSnap.docs.filter(doc => {
    const d = doc.data();
    const sets = d.score?.sets || [];
    const userSets = sets.filter(s => d.challenger === userId ? s.you > s.them : s.them > s.you).length;
    return userSets > sets.length - userSets;
  }).length;
  document.getElementById("ch-success").textContent = sentCount > 0
    ? `${((successSentCount/sentCount)*100).toFixed(1)}%` : "0%";
  const successRecCount = recSnap.docs.filter(doc => {
    const d = doc.data();
    const sets = d.score?.sets || [];
    const userSets = sets.filter(s => d.opponent === userId ? s.them > s.you : s.you > s.them).length;
    return userSets > sets.length - userSets;
  }).length;
  document.getElementById("ch-defense").textContent = recCount > 0
    ? `${((successRecCount/recCount)*100).toFixed(1)}%` : "0%";

  // === Ranking Progress ===
  // Determine starting and current rank for this ladder
  const params = new URLSearchParams(window.location.search);
  const ladderId = params.get("ladderId");
  let startRank = playerData.startRank;
  let currentRank = startRank !== undefined ? startRank : 0;

  if (ladderId) {
    try {
      const ladderSnap = await getDoc(doc(db, "ladders", ladderId));
      if (ladderSnap.exists()) {
        const participants = ladderSnap.data().participants || [];
        // Compute current rank from participants order (1-based)
        currentRank = participants.indexOf(userId) + 1;
        // If no recorded startRank, default it to current rank
        if (startRank === undefined) startRank = currentRank;
      }
    } catch (err) {
      console.error("Error fetching ladder for ranking progress:", err);
    }
  }

  const bestRank = Math.min(startRank, currentRank);
  const netMovement = startRank - currentRank;

  document.getElementById("rank-start").textContent   = `#${startRank}`;
  document.getElementById("rank-current").textContent = `#${currentRank}`;
  document.getElementById("rank-best").textContent    = `#${bestRank}`;
  document.getElementById("rank-net").textContent     = `${netMovement >= 0 ? '+' : ''}${netMovement}`;

  // Render recent matches into the existing section
  const list = document.getElementById("recent-matches");
  list.innerHTML = "";

  if (recentMatches.length === 0) {
    list.innerHTML = `
      <div class="p-3 rounded-lg bg-gray-50 text-gray-500 text-sm text-center border border-dashed border-gray-300">
        No recent matches to display.
      </div>
    `;
  } else {
    const recent3 = recentMatches.slice(-3).reverse();
    for (const match of recent3) {
      // Determine opponent ID and fetch name
      const opponentId = match.challenger === userId ? match.opponent : match.challenger;
      let opponentName = opponentId;
      try {
        const oppSnap = await getDoc(doc(db, "players", opponentId));
        if (oppSnap.exists()) {
          const pd = oppSnap.data();
          opponentName = `${pd.firstName} ${pd.lastName}`;
        }
      } catch {
        // ignore
      }

      // Compute set wins
      const sets = match.score?.sets || [];
      let userSetWins = 0;
      sets.forEach(s => {
        if (match.challenger === userId ? s.you > s.them : s.them > s.you) {
          userSetWins++;
        }
      });
      const opponentSetWins = sets.length - userSetWins;
      const isWin = userSetWins > opponentSetWins;
      const resultLabel = isWin ? "Won" : "Lost";

      // Build score text
      const scoreText = sets
        .map(s => match.challenger === userId ? `${s.you}-${s.them}` : `${s.them}-${s.you}`)
        .join(", ");

      // Format date as days ago
      let dateText = "";
      if (match.completedAt) {
        const dt = match.completedAt.toDate ? match.completedAt.toDate() : new Date(match.completedAt);
        const diffDays = Math.floor((Date.now() - dt.getTime())/(1000*60*60*24));
        dateText = diffDays === 0 ? "Today" : diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      }

      list.innerHTML += `
        <div class="w-full flex items-center justify-between p-3 bg-${isWin ? "green" : "red"}-50 rounded-lg mb-2">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div>
              <p class="font-medium text-black">vs ${opponentName}</p>
              <p class="text-gray-600 text-sm">${dateText}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-${isWin ? "green" : "red"}-600">${resultLabel}</p>
            <p class="text-gray-600 text-sm">${scoreText}</p>
          </div>
        </div>`;
    }
  }
}

/**
 * init - entry point called by main.js
 */
export function init() {
  console.log("Stats.js init");
  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.href = "/auth.html";
      return;
    }
    await loadPlayerStats(user.uid);
  });
}