import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, getCurrentUID } from "../firebase-setup.js";

// Toast helper for non-blocking messages
function showToast(message, duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  container.classList.remove("hidden");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      container.removeChild(toast);
      if (!container.children.length) container.classList.add("hidden");
    }, 300);
  }, duration);
}

console.log("Report.js loaded");

const urlParams = new URLSearchParams(window.location.search);
const challengeId = urlParams.get("challengeId") || urlParams.get("id");

// Ensure match details load even if init() is never called
loadMatchDetails();

const matchSummary = document.getElementById("match-summary");
const reportForm = document.getElementById("report-form");
const confirmation = document.getElementById("confirmation");

const submitBtn = reportForm.querySelector("button[type='submit']");

async function loadMatchDetails() {
  if (!challengeId) {
    console.error("Invalid or missing challengeId in URL");
    matchSummary.innerHTML = "<p class='text-red-500'>Invalid challenge ID</p>";
    return;
  }

  console.log("Challenge ID from URL:", challengeId);
  const challengeRef = doc(db, "challenges", challengeId);
  const challengeSnap = await getDoc(challengeRef);

  if (!challengeSnap.exists()) {
    console.error(`Challenge document NOT found for ID: ${challengeId}`);
    matchSummary.innerHTML = "<p class='text-red-500'>No such challenge found</p>";
    return;
  }

  const data = challengeSnap.data();
  console.log("Fetched challenge data:", data);

  const summaryEl = document.getElementById("match-summary");
  const { challenger, opponent, dateIssued } = data;

  const getName = async (uid) => {
    const playerSnap = await getDoc(doc(db, "players", uid));
    return playerSnap.exists() ? playerSnap.data().firstName || uid : uid;
  };

  const challengerName = await getName(challenger);
  const opponentName = await getName(opponent);

  let dateStr = "Unknown";
  if (dateIssued?.toDate) {
    const dateObj = dateIssued.toDate();
    dateStr = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else if (typeof dateIssued === "string") {
    dateStr = new Date(dateIssued).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Fetch ladderId and player ranks
  const ladderId = data.ladderId;

  const getRank = async (ladderId, uid) => {
    const playerRef = doc(db, "ladders", ladderId, "players", uid);
    const playerSnap = await getDoc(playerRef);
    return playerSnap.exists() ? playerSnap.data().rank || "?" : "?";
  };

  const challengerRank = await getRank(ladderId, challenger);
  const opponentRank = await getRank(ladderId, opponent);

  summaryEl.innerHTML = `
    <p class="font-semibold text-lg">${challengerName} (${challengerRank}) vs. ${opponentName} (${opponentRank})</p>
    <p class="text-sm text-white/70 mt-1">Date Issued: ${dateStr}</p>
  `;
}

reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const sets = [
    {
      you: parseInt(document.getElementById("set1-you").value || 0),
      them: parseInt(document.getElementById("set1-them").value || 0)
    },
    {
      you: parseInt(document.getElementById("set2-you").value || 0),
      them: parseInt(document.getElementById("set2-them").value || 0)
    },
    {
      you: parseInt(document.getElementById("set3-you").value || 0),
      them: parseInt(document.getElementById("set3-them").value || 0)
    }
  ];

  console.log("Submitting sets:", sets);

  try {
    const challengeRef = doc(db, "challenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);
    const challengeData = challengeSnap.data();

    // Determine winner and loser (simple MVP logic: whoever won most sets)
    let player1Wins = 0;
    let player2Wins = 0;

    sets.forEach(set => {
      if (set.you > set.them) player1Wins++;
      else if (set.them > set.you) player2Wins++;
    });

    const winnerId = player1Wins > player2Wins ? challengeData.challenger : challengeData.opponent;
    const loserId = winnerId === challengeData.challenger ? challengeData.opponent : challengeData.challenger;

    console.log(`Winner: ${winnerId}, Loser: ${loserId}`);

    // ✅ Update challenge document
    await updateDoc(challengeRef, {
      status: "completed",
      score: { sets },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`Score saved for challenge ${challengeId}`);

    // ✅ Create new match document
    const matchesRef = collection(db, "matches");
    await addDoc(matchesRef, {
      uid: getCurrentUID(),
      players: [challengeData.challenger, challengeData.opponent],
      winner: winnerId,
      loser: loserId,
      datePlayed: serverTimestamp(),
      score: { sets }
    });

    console.log("New match document created in 'matches' collection");

    confirmation.classList.remove("hidden");
    reportForm.classList.add("hidden");
    showToast("Score submitted successfully!");
    setTimeout(() => window.location.href = "challenges.html", 2000);

  } catch (error) {
    console.error("🔥 Error saving score and creating match document:", error);
    showToast("Failed to save score. Try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Score";
  }
});

/**
 * init - entry point called by main.js
 */
export async function init() {
  console.log("Report.js init");
  await loadMatchDetails();
}