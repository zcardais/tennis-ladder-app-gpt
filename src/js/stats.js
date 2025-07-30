import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth, getCurrentUID } from "../firebase-setup.js";
import { onAuthStateChanged } from "firebase/auth";

console.log("Stats.js loaded");

async function loadPlayerStats(userId) {
  // Fetch player info by querying for uid
  const playerQuery = query(collection(db, "players"), where("uid", "==", userId));
  const playerSnap = await getDocs(playerQuery);
  if (playerSnap.empty) {
    console.error("Player not found!");
    return;
  }
  const playerData = playerSnap.docs[0].data();
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

  await renderMatchHistory(userId, recentMatches);
}

async function renderMatchHistory(userId, recentMatches) {
  // === Match History Section (grouped by ladder) ===
  const historyContainer = document.querySelector("#section-history .space-y-6");
  if (historyContainer) {
    historyContainer.innerHTML = ""; // clear default

    // Group matches by ladderId
    const ladderGroups = {};
    const ladderNames = new Set();
    for (const match of recentMatches) {
      const lid = match.ladderId || "unknown";
      if (!ladderGroups[lid]) ladderGroups[lid] = [];
      ladderGroups[lid].push(match);
    }

    for (const [ladderId, matches] of Object.entries(ladderGroups)) {
      let ladderName = "Unknown Ladder";
      let ladderStatus = "Finished";
      try {
        const ladderSnap = await getDoc(doc(db, "ladders", ladderId));
        if (ladderSnap.exists()) {
          const ladderData = ladderSnap.data();
          ladderName = ladderData.name || "Unnamed Ladder";
          ladderStatus = ladderData.active ? "Active" : "Finished";
        }
      } catch {}

      ladderNames.add(ladderName);

      const section = document.createElement("div");
      section.dataset.ladder = ladderId;
      section.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-semibold text-black">${ladderName}</h4>
          <span class="text-xs px-2 py-0.5 rounded-full ${ladderStatus === "Active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}">${ladderStatus}</span>
        </div>
      `;

      matches.forEach(async match => {
        const sets = match.score?.sets || [];
        const opponentId = match.challenger === userId ? match.opponent : match.challenger;
        let opponentName = opponentId;
        try {
          const oppSnap = await getDoc(doc(db, "players", opponentId));
          if (oppSnap.exists()) {
            const pd = oppSnap.data();
            opponentName = `${pd.firstName} ${pd.lastName}`;
          }
        } catch {}

        const initials = opponentName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

        const scoreText = sets
          .map(s => match.challenger === userId ? `${s.you}-${s.them}` : `${s.them}-${s.you}`)
          .join(", ");

        const userSetWins = sets.filter(s => (match.challenger === userId ? s.you > s.them : s.them > s.you)).length;
        const isWin = userSetWins > sets.length - userSetWins;
        const resultLabel = isWin ? "Won" : "Lost";

        let dateText = "";
        if (match.completedAt) {
          const dt = match.completedAt.toDate ? match.completedAt.toDate() : new Date(match.completedAt);
          const diffDays = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
          dateText = diffDays === 0 ? "Today" : diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
        }

        const card = document.createElement("div");
        card.className = `rounded-lg p-3 space-y-1 ${isWin ? "bg-green-50" : "bg-red-50"}`;
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-blue-300 text-white font-bold rounded-full flex items-center justify-center">${initials}</div>
              <div>
                <p class="text-sm font-semibold text-black">vs ${opponentName}</p>
                <p class="text-xs text-gray-600">${dateText} • Rank #-- → #--</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-${isWin ? "green" : "red"}-600 text-sm">${resultLabel}</p>
              <p class="text-xs text-gray-600">${scoreText}</p>
            </div>
          </div>
        `;
        section.appendChild(card);
      });

      historyContainer.appendChild(section);
    }

    const ladderFilters = document.getElementById("ladder-filters");
    if (ladderFilters) {
      const names = ["All Ladders", ...ladderNames];
      ladderFilters.innerHTML = "";
      names.forEach(name => {
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.className = `px-3 py-1 text-sm font-medium rounded-full ${name === "All Ladders" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`;
        btn.addEventListener("click", () => {
          // Visual highlight
          [...ladderFilters.children].forEach(b => {
            b.classList.remove("bg-blue-600", "text-white");
            b.classList.add("bg-gray-200", "text-gray-700");
          });
          btn.classList.add("bg-blue-600", "text-white");
          btn.classList.remove("bg-gray-200", "text-gray-700");

          const allSections = document.querySelectorAll("#section-history [data-ladder]");
          allSections.forEach(section => {
            const header = section.querySelector("h4")?.textContent || "";
            if (name === "All Ladders" || header.includes(name)) {
              section.classList.remove("hidden");
            } else {
              section.classList.add("hidden");
            }
          });
        });
        ladderFilters.appendChild(btn);
      });
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
    const uid = getCurrentUID();
    await loadPlayerStats(uid);

    // Tab switching logic
    const tabOverview = document.getElementById("tab-overview");
    const tabHistory = document.getElementById("tab-history");
    const sectionOverview = document.getElementById("section-overview");
    const sectionHistory = document.getElementById("section-history");

    if (tabOverview && tabHistory && sectionOverview && sectionHistory) {
      tabOverview.addEventListener("click", () => {
        sectionOverview.classList.remove("hidden");
        sectionHistory.classList.add("hidden");
        tabOverview.classList.add("bg-white", "text-black");
        tabOverview.classList.remove("bg-gray-100", "text-gray-500");
        tabHistory.classList.remove("bg-white", "text-black");
        tabHistory.classList.add("bg-gray-100", "text-gray-500");
      });

      tabHistory.addEventListener("click", () => {
        sectionOverview.classList.add("hidden");
        sectionHistory.classList.remove("hidden");
        tabOverview.classList.remove("bg-white", "text-black");
        tabOverview.classList.add("bg-gray-100", "text-gray-500");
        tabHistory.classList.add("bg-white", "text-black");
        tabHistory.classList.remove("bg-gray-100", "text-gray-500");
      });

      // Auto-switch to history tab if hash is #history
      if (window.location.hash === "#history") {
        tabHistory.click();
      }

      // Ladder filter buttons logic
      const filterButtons = document.querySelectorAll("#ladder-filters button");
      filterButtons.forEach(button => {
        button.addEventListener("click", () => {
          // Visual highlight
          filterButtons.forEach(b => {
            b.classList.remove("bg-blue-600", "text-white");
            b.classList.add("bg-gray-200", "text-gray-700");
          });
          button.classList.add("bg-blue-600", "text-white");
          button.classList.remove("bg-gray-200", "text-gray-700");

          const selected = button.textContent.trim();
          const allSections = document.querySelectorAll("#section-history [data-ladder]");

          allSections.forEach(section => {
            const header = section.querySelector("h4")?.textContent || "";
            if (selected === "All Ladders" || header.includes(selected)) {
              section.classList.remove("hidden");
            } else {
              section.classList.add("hidden");
            }
          });
        });
      });
    }

    // Scroll to ladder filter bar when Filter button is clicked
    const filterButton = document.querySelector("#section-history button");
    if (filterButton) {
      filterButton.addEventListener("click", () => {
        document.getElementById("ladder-filters")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  });
  }