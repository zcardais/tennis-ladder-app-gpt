import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase-setup.js";

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
        <p class="font-bold text-lg">${challenge.challenger} vs. ${challenge.opponent}</p>
        <p class="text-gray-600">Date Issued: ${formattedDate}</p>
    `;

    if (challenge.status === "pending") {
      html += `
        <div class="mt-2 flex space-x-2">
          <button onclick="handleAccept('${challenge.id}')" class="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
          <button onclick="handleDeny('${challenge.id}')" class="bg-red-500 text-white px-3 py-1 rounded">Deny</button>
        </div>
      `;
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "active") {
      html += `
        <div class="mt-2">
          <button onclick="handleReport('${challenge.id}')" class="bg-blue-500 text-white px-3 py-1 rounded">Report Score</button>
        </div>
      `;
      html += `</div>`;
      feed.innerHTML += html;
    } else if (challenge.status === "completed") {
      const sets = challenge.score?.sets || [];
      const scoreText = sets.map(
        (set, idx) => `Set ${idx + 1}: ${set.you}-${set.them}`
      ).join(", ");

      html += `
        <p class="text-gray-700 mt-2">Score: ${scoreText}</p>
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
    status: "active",
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

fetchChallenges().then(renderChallenges);