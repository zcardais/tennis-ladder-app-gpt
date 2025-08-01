import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, getCurrentUID } from "../firebase-setup.js";
console.log("✅ DB Loaded:", db);

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("challenge-form");
  const statusMessage = document.getElementById("status-message");
  const opponentList = document.getElementById("opponent-list");

  let selectedOpponent = null;
  const auth = getAuth();
  let challenger = null;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      challenger = user.uid;
    } else {
      window.location.href = "/auth.html";
    }
  });

  const params = new URLSearchParams(window.location.search);
  const ladderId = params.get("ladderId");

  async function loadOpponents() {
    if (!ladderId) return;

    // Clear previous cards
    if (opponentList) opponentList.innerHTML = "";

    // 🔍 Diagnostic block: log all players' ladderId and their types
    const allSnap = await getDocs(collection(db, "players"));
    console.log("🔍 Ladder ID diagnostic — all players:");
    allSnap.forEach(doc => {
      const p = doc.data();
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
      console.log(`${name}:`, p.ladderId, `(${typeof p.ladderId})`);
    });

    const q = query(collection(db, "players"), where("ladderId", "==", ladderId));
    const snap = await getDocs(q);

    console.log("Ladder ID:", ladderId);
    console.log("Fetched players:", snap.size);

    const players = [];
    snap.forEach(doc => {
      const player = doc.data();
      players.push(player);
    });

    // Sort players by ascending rank
    players.sort((a, b) => (a.rank || 999) - (b.rank || 999));

    players.forEach(player => {
      const fullName = `${player.firstName || ""} ${player.lastName || ""}`.trim();
      console.log("Player found:", fullName);
      if (fullName.toLowerCase() === challenger.toLowerCase()) return;

      const card = document.createElement("div");
      card.className = "p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-colors bg-white text-gray-900";
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">${player.rank || "?"}</span>
            </div>
            <div>
              <p class="font-semibold">${fullName}</p>
              <p class="text-gray-500 text-sm">${player.record || "record unknown"}</p>
            </div>
          </div>
          <div class="select-indicator w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        </div>
      `;
      card.addEventListener("click", () => {
        selectedOpponent = fullName;
        document.querySelectorAll("#opponent-list .select-indicator").forEach(el => {
          el.classList.remove("bg-blue-500", "border-blue-500");
          el.innerHTML = "";
        });
        const indicator = card.querySelector(".select-indicator");
        indicator.classList.add("bg-blue-500", "border-blue-500", "flex", "items-center", "justify-center");
        indicator.innerHTML = `<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`;
      });
      if (opponentList) opponentList.appendChild(card);
    });
  }

  await loadOpponents();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!ladderId || !selectedOpponent) {
      alert("Missing ladder ID or opponent.");
      return;
    }

    statusMessage.textContent = "Submitting...";
    statusMessage.classList.remove("hidden");

    // Check for duplicate open challenge to same player
    const challengeQuery = query(
      collection(db, "challenges"),
      where("ladderId", "==", ladderId),
      where("challenger", "==", challenger),
      where("opponent", "==", selectedOpponent),
      where("status", "in", ["pending", "accepted"])
    );
    const existingChallenges = await getDocs(challengeQuery);

    if (!existingChallenges.empty) {
      alert("You already have an open challenge to this player.");
      statusMessage.textContent = "";
      statusMessage.classList.add("hidden");
      return;
    }

    try {
      await addDoc(collection(db, "challenges"), {
        uid: getCurrentUID(),
        ladderId,
        challenger,
        opponent: selectedOpponent,
        status: "pending",
        dateIssued: serverTimestamp()
      });
      statusMessage.textContent = "🎾 Challenge sent!";
      statusMessage.classList.remove("text-gray-500");
      statusMessage.classList.add("text-green-600", "font-medium");
      // Success animation and auto-dismiss
      statusMessage.classList.add("transition", "duration-300", "opacity-100");
      setTimeout(() => {
        statusMessage.classList.add("opacity-0");
        setTimeout(() => {
          statusMessage.classList.add("hidden");
          statusMessage.classList.remove("opacity-0", "text-green-600", "font-medium");
          statusMessage.textContent = "";
        }, 300);
      }, 2500);
      form.reset();
      selectedOpponent = null;
      if (opponentList) opponentList.innerHTML = "";
      await loadOpponents();
    } catch (err) {
      console.error("Error submitting challenge:", err);
      statusMessage.textContent = "Error submitting challenge.";
    }
  });
});