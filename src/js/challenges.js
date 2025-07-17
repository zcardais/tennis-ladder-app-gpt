import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase-setup.js";
import { auth } from "../firebase-setup.js";
import { onAuthStateChanged } from "firebase/auth";
import { query, where } from "firebase/firestore";

const playerNameCache = {};

async function getPlayerName(uid) {
  if (playerNameCache[uid]) return playerNameCache[uid];

  const playerRef = doc(db, "players", uid);
  const playerSnap = await getDoc(playerRef);
  const name = playerSnap.exists()
    ? playerSnap.data().firstName || uid
    : uid;

  playerNameCache[uid] = name;
  return name;
}

// Toast helper for non-blocking messages
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 left-4 px-4 py-2 rounded shadow-lg text-white z-50 ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

console.log("Challenges.js loaded");

async function fetchChallenges(uid) {
  const q = query(
    collection(db, "challenges"),
    where("status", "in", ["pending", "accepted", "completed"])
  );
  const snap = await getDocs(q);

  const challenges = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.challenger === uid || data.opponent === uid) {
      const challengerName = await getPlayerName(data.challenger);
      const opponentName = await getPlayerName(data.opponent);
      challenges.push({
        id: docSnap.id,
        ...data,
        challengerName,
        opponentName
      });
    }
  }

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

function renderChallenges(challenges, currentUid) {
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
      if (challenge.opponent === currentUid) {
        html += `
          <p class="font-bold text-lg">${challenge.challengerName} vs. ${challenge.opponentName}</p>
          <p class="text-gray-600">Date Issued: ${formattedDate}</p>
          <div class="mt-2 flex space-x-2">
            <button onclick="handleAccept('${challenge.id}')" class="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
            <button onclick="handleDeny('${challenge.id}')" class="bg-red-500 text-white px-3 py-1 rounded">Deny</button>
          </div>
        `;
      } else {
        html += `
          <p class="font-bold text-lg">${challenge.challengerName} vs. ${challenge.opponentName}</p>
          <p class="text-gray-600">Date Issued: ${formattedDate}</p>
          <p class="italic text-gray-500 mt-2">Waiting for opponent to accept...</p>
        `;
      }
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "accepted") {
      html += `
        <p class="font-bold text-lg">${challenge.challengerName} vs. ${challenge.opponentName}</p>
        <p class="text-gray-600">Date Issued: ${formattedDate}</p>
        <div class="mt-2">
          <button onclick="handleReport('${challenge.id}')" class="bg-blue-500 text-white px-3 py-1 rounded">Report Score</button>
        </div>
      `;
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "completed") {
      const sets = challenge.score?.sets || [];
      const player1 = challenge.challengerName;
      const player2 = challenge.opponentName;

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
  const button = event.target;
  button.disabled = true;
  button.textContent = "Accepting...";
  try {
    const challengeRef = doc(db, "challenges", challengeId);
    await updateDoc(challengeRef, {
      status: "accepted",
      updatedAt: serverTimestamp()
    });
    showToast("Challenge accepted!");
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    console.error("Error accepting challenge:", err);
    showToast("Failed to accept challenge.", "error");
    button.disabled = false;
    button.textContent = "Accept";
  }
};

window.handleDeny = async function (challengeId) {
  console.log("Denying challenge:", challengeId);
  const button = event.target;
  button.disabled = true;
  button.textContent = "Denying...";
  try {
    const challengeRef = doc(db, "challenges", challengeId);
    await updateDoc(challengeRef, {
      status: "denied",
      updatedAt: serverTimestamp()
    });
    showToast("Challenge denied.");
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    console.error("Error denying challenge:", err);
    showToast("Failed to deny challenge.", "error");
    button.disabled = false;
    button.textContent = "Deny";
  }
};

window.handleReport = function (challengeId) {
  console.log("Navigating to report page for challenge:", challengeId);
  window.location.href = `report.html?challengeId=${challengeId}`;
};

/**
 * init - entry point called by main.js
 */
export function init() {
  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.href = "/auth.html";
      return;
    }

    console.log("Challenges init for user:", user.uid);
    try {
      const challenges = await fetchChallenges(user.uid);
      renderChallenges(challenges, user.uid);
    } catch (err) {
      console.error("🔥 Error initializing challenges:", err);
    }
  });
}