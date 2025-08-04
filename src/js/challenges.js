import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { db, getCurrentUID } from "../firebase-setup.js";
import { auth } from "../firebase-setup.js";
import { onAuthStateChanged } from "firebase/auth";
// Additional imports for Firestore queries

const playerNameCache = {};

async function getPlayerName(uid) {
  console.log(`[getPlayerName] start lookup for uid=${uid}`);
  if (playerNameCache[uid] && playerNameCache[uid] !== uid) {
    return playerNameCache[uid];
  }

  // Find the player document whose 'uid' field matches, falling back to document ID
  const playersRef = collection(db, "players");
  const uidQuery = query(playersRef, where("uid", "==", uid));
  const querySnap = await getDocs(uidQuery);
  console.log(`[getPlayerName] querySnap.empty=${querySnap.empty}`, querySnap.docs.map(d => ({ id: d.id, data: d.data() })));
  let playerSnap;
  if (!querySnap.empty) {
    // Found by uid field
    playerSnap = querySnap.docs[0];
  } else {
    // Fallback to document ID lookup
    const directRef = doc(db, "players", uid);
    const directSnap = await getDoc(directRef);
    playerSnap = directSnap.exists() ? directSnap : null;
    console.log(`[getPlayerName] directSnap.exists()=${directSnap.exists()}`, directSnap.exists() ? directSnap.data() : null);
  }
  let name;
  if (playerSnap && playerSnap.exists()) {
    const first = playerSnap.data().firstName || "";
    const last = playerSnap.data().lastName || "";
    name = (first || last)
      ? `${first} ${last}`.trim()
      : playerSnap.data().username || uid;
  } else if (auth.currentUser && auth.currentUser.uid === uid && auth.currentUser.displayName) {
    name = auth.currentUser.displayName;
  } else {
    name = uid;
  }
  console.log(`[getPlayerName] uid=${uid}, resolved name=${name}, fetchedFrom=${playerSnap?.id || 'none'}`);
  if (name && name !== uid) {
    playerNameCache[uid] = name;
  }
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

async function fetchActiveChallenges(uid) {
  const q = query(
    collection(db, "challenges"),
    where("status", "in", ["pending", "accepted"])
  );
  const snap = await getDocs(q);

  const challenges = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.challenger === uid || data.opponent === uid) {
      if ((data.status === "pending" || data.status === "accepted") && !data.completedAt) {
        const challengerName = await getPlayerName(data.challenger);
        const opponentName = await getPlayerName(data.opponent);

        const challengerUid = data.challenger;
        const opponentUid    = data.opponent;

        challenges.push({
          id: docSnap.id,
          ...data,
          challengerName,
          opponentName,
          challengerUid,
          opponentUid
        });
      }
    }
  }

  console.log("Fetched active challenges:", challenges);
  console.log("fetchActiveChallenges IDs:", challenges.map(c => c.id));
  return challenges;
}

async function fetchCompletedChallenges(uid) {
  const q = query(
    collection(db, "challenges"),
    where("status", "==", "completed")
  );
  const snap = await getDocs(q);
  const completed = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.challenger === uid || data.opponent === uid) {
      const challengerName = await getPlayerName(data.challenger);
      const opponentName  = await getPlayerName(data.opponent);
      const challengerUid = data.challenger;
      const opponentUid    = data.opponent;
      completed.push({
        id: docSnap.id,
        ...data,
        challengerName,
        opponentName,
        challengerUid,
        opponentUid
      });
    }
  }
  console.log("Fetched completed challenges:", completed.map(c => c.id));
  return completed;
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

function renderActiveChallenges(challenges, currentUid, completedIds = []) {
  console.log("renderActiveChallenges input IDs:", challenges.map(c => c.id), "completedIds:", completedIds);
  const feed = document.getElementById("challenges-feed");
  const history = document.getElementById("history-feed");

  feed.innerHTML = "";
  history.innerHTML = "";

  // Exclude any challenges already completed or in completedIds
  const activeList = challenges.filter(c => c.status !== "completed" && !c.completedAt && !completedIds.includes(c.id));
  console.log("renderActiveChallenges activeList IDs:", activeList.map(c => c.id));
  if (!activeList.length) {
    feed.innerHTML = "<p class='text-gray-100'>No active challenges.</p>";
    return;
  }

  activeList.forEach((challenge) => {
    const formattedDate = formatDate(challenge.dateIssued);

    if (challenge.status === "pending" && !challenge.completedAt) {
      let html = `
      <div data-id="${challenge.id}" class="bg-red-100 rounded-lg p-4 shadow">
    `;
      if (challenge.opponent === currentUid) {
        html += `
          <p class="font-bold text-lg">
            ${challenge.challengerUid === currentUid ? "You" : challenge.challengerName}
            vs.
            ${challenge.opponentUid === currentUid ? "You" : challenge.opponentName}
          </p>
          <p class="text-gray-600">Date Issued: ${formattedDate}</p>
          <div class="mt-2 flex space-x-2">
            <button onclick="handleAccept('${challenge.id}')" class="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
            <button onclick="handleDeny('${challenge.id}')" class="bg-red-500 text-white px-3 py-1 rounded">Deny</button>
          </div>
        `;
      } else {
        html += `
          <p class="font-bold text-lg">
            ${challenge.challengerUid === currentUid ? "You" : challenge.challengerName}
            vs.
            ${challenge.opponentUid === currentUid ? "You" : challenge.opponentName}
          </p>
          <p class="text-gray-600">Date Issued: ${formattedDate}</p>
          <p class="italic text-gray-500 mt-2">Waiting for ${challenge.opponentUid === currentUid ? "you" : challenge.opponentName} to accept...</p>
        `;
      }
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "accepted" && !challenge.completedAt) {
      let html = `
        <div data-id="${challenge.id}" class="bg-white rounded-lg p-4 shadow">
        <p class="font-bold text-lg">
          ${challenge.challengerUid === currentUid ? "You" : challenge.challengerName}
          vs.
          ${challenge.opponentUid === currentUid ? "You" : challenge.opponentName}
        </p>
        <p class="text-gray-600">Date Issued: ${formattedDate}</p>
        <div class="mt-2">
          <button onclick="handleReport('${challenge.id}')" class="bg-blue-500 text-white px-3 py-1 rounded">Report Score</button>
        </div>
      `;
      html += `</div>`;
      feed.innerHTML += html;
    }
  });
}

function renderCompletedChallenges(challenges, currentUid) {
  console.log("renderCompletedChallenges input IDs:", challenges.map(c => c.id));
  const history = document.getElementById("history-feed");
  history.innerHTML = "";

  challenges.forEach((challenge) => {
    let html = `
      <div data-id="${challenge.id}" class="bg-white rounded-lg p-4 shadow">
    `;
    const sets = challenge.score?.sets || [];
    const isYou = challenge.challengerUid === currentUid;
    const player1 = isYou ? "You" : challenge.challengerName;
    const player2 = isYou ? challenge.opponentName : "You";

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
      .map(set => {
        // Show winner’s score first
        if (winner === player1) {
          return `${set.you}-${set.them}`;
        } else {
          return `${set.them}-${set.you}`;
        }
      })
      .join(", ");
    const completedDate = challenge.completedAt?.toDate?.().toISOString().split("T")[0] || "Unknown";

    html += `
      <p class="text-xl text-gray-800"><b>${winner}</b> def. ${loser} | ${scoreString}</p>
      <p class="text-gray-600 text-sm">Date reported: ${completedDate}</p>
    `;
    html += `</div>`;
    history.innerHTML += html;
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

    const uid = user.uid;
    console.log("Challenges init for user:", uid);
    // Debug: list all player doc IDs to verify existence
    const allPlayersSnap = await getDocs(collection(db, "players"));
    console.log("[Debug] All player document IDs:", allPlayersSnap.docs.map(d => d.id));
    try {
      // Fetch both lists
      const [active, completed] = await Promise.all([
        fetchActiveChallenges(uid),
        fetchCompletedChallenges(uid)
      ]);
      console.log("init fetched active IDs:", active.map(c => c.id), "completed IDs:", completed.map(c => c.id));
      const completedIds = completed.map(c => c.id);
      // Render, excluding completed IDs from the active list
      renderActiveChallenges(active, uid, completedIds);
      renderCompletedChallenges(completed, uid);
    } catch (err) {
      console.error("🔥 Error initializing challenges:", err);
    }
  });
}