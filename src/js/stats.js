import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase-setup.js";

console.log("Stats.js loaded");

async function loadPlayerStats() {
  const userId = "tyler"; // Replace with actual logged-in user id

  // Fetch player info
  const playerRef = doc(db, "players", userId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    console.error("Player not found!");
    return;
  }

  const playerData = playerSnap.data();
  document.getElementById("player-name").innerText = playerData.name;
  document.getElementById("player-initials").innerText = playerData.name
    .split(" ")
    .map(n => n[0])
    .join("");
  document.getElementById("player-rank").innerText = `#${playerData.rank}`;
  document.getElementById("player-record").innerText = playerData.record;

  // Fetch matches
  const matchesQuery = query(collection(db, "matches"), where("players", "array-contains", userId));
  const matchesSnap = await getDocs(matchesQuery);

  let wins = 0, losses = 0;
  const recentMatches = [];

  matchesSnap.forEach(doc => {
    const match = doc.data();
    if (match.winner === userId) wins++;
    if (match.loser === userId) losses++;
    recentMatches.push(match);
  });

  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : "--";

  document.getElementById("total-wins").innerText = wins;
  document.getElementById("total-losses").innerText = losses;
  document.getElementById("win-rate").innerText = `${winRate}%`;

  // Render recent matches
  const matchesContainer = document.getElementById("recent-matches");
  matchesContainer.innerHTML = "";
  if (recentMatches.length === 0) {
    matchesContainer.innerHTML = `<div class="p-3 rounded-lg bg-gray-50 text-gray-500 text-sm text-center border border-dashed border-gray-300">
      No recent matches to display.
    </div>`;
  } else {
    recentMatches.slice(0, 5).forEach(m => {
      matchesContainer.innerHTML += `
        <div class="p-3 rounded-lg bg-gray-50">
          <p class="text-black font-medium">${m.players[0]} vs. ${m.players[1]}</p>
          <p class="text-gray-600 text-sm">Result: ${m.winner} won</p>
        </div>`;
    });
  }
}

loadPlayerStats();