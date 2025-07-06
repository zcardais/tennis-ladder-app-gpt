import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "./firebase-setup.js";

console.log("Report.js loaded");

const urlParams = new URLSearchParams(window.location.search);
const challengeId = urlParams.get("challengeId");

const matchSummary = document.getElementById("match-summary");
const reportForm = document.getElementById("report-form");
const confirmation = document.getElementById("confirmation");

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

  matchSummary.innerHTML = `
    <p class="text-lg font-bold">${data.challenger} vs. ${data.opponent}</p>
    <p class="text-gray-600">Date Issued: ${data.dateIssued}</p>
  `;
}

reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const sets = [
    [
      parseInt(document.getElementById("set1-you").value || 0),
      parseInt(document.getElementById("set1-them").value || 0)
    ],
    [
      parseInt(document.getElementById("set2-you").value || 0),
      parseInt(document.getElementById("set2-them").value || 0)
    ],
    [
      parseInt(document.getElementById("set3-you").value || 0),
      parseInt(document.getElementById("set3-them").value || 0)
    ]
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
      if (set[0] > set[1]) player1Wins++;
      else if (set[1] > set[0]) player2Wins++;
    });

    const winnerId = player1Wins > player2Wins ? challengeData.challenger : challengeData.opponent;
    const loserId = winnerId === challengeData.challenger ? challengeData.opponent : challengeData.challenger;

    console.log(`Winner: ${winnerId}, Loser: ${loserId}`);

    // ✅ Update challenge document
    await updateDoc(challengeRef, {
      status: "completed",
      score: { sets },
      updatedAt: serverTimestamp()
    });

    console.log(`Score saved for challenge ${challengeId}`);

    // ✅ Create new match document
    const matchesRef = collection(db, "matches");
    await addDoc(matchesRef, {
      players: [challengeData.challenger, challengeData.opponent],
      winner: winnerId,
      loser: loserId,
      datePlayed: serverTimestamp(),
      score: { sets }
    });

    console.log("New match document created in 'matches' collection");

    confirmation.classList.remove("hidden");
    reportForm.classList.add("hidden");
    setTimeout(() => window.location.href = "challenges.html", 2000);

  } catch (error) {
    console.error("🔥 Error saving score and creating match document:", error);
    alert("Failed to save score. Try again.");
  }
});

loadMatchDetails();