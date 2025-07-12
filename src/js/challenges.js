import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase-setup.js";

console.log("Challenges.js loaded");

async function fetchChallenges() {
  const querySnapshot = await getDocs(collection(db, "challenges"));
  const challenges = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    challenges.push({
      id: docSnap.id,
      ...data
    });
  });
  console.log("Fetched challenges:", challenges);
  return challenges;
}

function formatDate(dateIssued) {
  if (dateIssued?.toDate) {
    // Firestore Timestamp object → ISO date
    return dateIssued.toDate().toISOString().split("T")[0];
  } else if (typeof dateIssued === "string") {
    return dateIssued; // Already a string
  } else {
    return "Unknown Date";
  }
}

function renderChallenges(challenges) {
  const feed = document.getElementById("challenges-feed");
  const history = document.getElementById("history-feed");

  feed.innerHTML = "";
  history.innerHTML = "";

  if (!challenges.length) {
    feed.innerHTML = "<p class='text-gray-100'>No active challenges.</p>";
    return;
  }

  challenges.forEach((challenge) => {
    const formattedDate = formatDate(challenge.dateIssued);
    let html = `
      <div class="bg-white rounded-lg p-4 shadow">
    `;

    if (challenge.status === "pending") {
      html += `
        <p class="font-bold text-lg">${challenge.challenger} vs. ${challenge.opponent}</p>
        <p class="text-gray-600">Date Issued: ${formattedDate}</p>
        <div class="mt-2 flex space-x-2">
          <button onclick="handleAccept('${challenge.id}')" class="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
          <button onclick="handleDeny('${challenge.id}')" class="bg-red-500 text-white px-3 py-1 rounded">Deny</button>
        </div>
      `;
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "accepted") {
      html += `
        <p class="font-bold text-lg">${challenge.challenger} vs. ${challenge.opponent}</p>
        <p class="text-gray-600">Date Issued: ${formattedDate}</p>
        <div class="mt-2">
          <button onclick="handleReport('${challenge.id}')" class="bg-blue-500 text-white px-3 py-1 rounded">Report Score</button>
        </div>
      `;
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "completed") {
      const sets = challenge.score?.sets || [];
      const player1 = challenge.challenger;
      const player2 = challenge.opponent;

      let player1Wins = 0;
      let player2Wins = 0;

      sets.forEach((set) => {
        if (set.you > set.them) player1Wins++;
        else if (set.them > set.you) player2Wins++;
      });

      const winner = player1Wins > player2Wins ? player1 : player2;
      const loser = player1Wins > player2Wins ? player2 : player1;
      const scoreString = sets
        .filter(set => !(set.you === 0 && set.them === 0))
        .map(set => `${set.you}-${set.them}`)
        .join(", ");
      const completedDate = challenge.completedAt?.toDate?.().toISOString().split("T")[0] || "Unknown";

      html += `
        <p class="text-xl text-gray-800"><b>${winner}</b> def. ${loser} | ${scoreString}</p>
        <p class="text-gray-600 text-sm">Date reported: ${completedDate}</p>
      `;
      html += `</div>`;
      history.innerHTML += html;
    }
  });
}

window.handleAccept = async function (challengeId) {
  console.log("Accepting challenge:", challengeId);
  const challengeRef = doc(db, "challenges", challengeId);
  await updateDoc(challengeRef, {
    status: "accepted",
    updatedAt: serverTimestamp()
  });
  window.location.reload();
};

window.handleDeny = async function (challengeId) {
  console.log("Denying challenge:", challengeId);
  const challengeRef = doc(db, "challenges", challengeId);
  await updateDoc(challengeRef, {
    status: "denied",
    updatedAt: serverTimestamp()
  });
  window.location.reload();
};

window.handleReport = function (challengeId) {
  console.log("Navigating to report page for challenge:", challengeId);
  window.location.href = `report.html?challengeId=${challengeId}`;
};

/**
 * init - entry point called by main.js
 */
export async function init() {
  console.log("Challenges init");
  try {
    const challenges = await fetchChallenges();
    renderChallenges(challenges);
  } catch (err) {
    console.error("🔥 Error initializing challenges:", err);
  }
}