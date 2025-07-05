import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-setup.js";

const loggedInPlayerId = "tyler"; // TEMP: replace with Firebase Auth user later

export async function init() {
  console.log("Challenges page loaded");

  const pendingList = document.getElementById("pending-list");
  const sentList = document.getElementById("sent-list");
  const historyList = document.getElementById("history-list");

  try {
    const querySnapshot = await getDocs(collection(db, "challenges"));
    const challenges = [];
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });

    console.log("Fetched challenges:", challenges);

    // Clear existing lists
    pendingList.innerHTML = "";
    sentList.innerHTML = "";
    historyList.innerHTML = "";

    challenges.forEach((challenge) => {
      const isChallenger = challenge.challenger === loggedInPlayerId;
      const isOpponent = challenge.opponent === loggedInPlayerId;

      // Create DOM element for challenge
      const challengeDiv = document.createElement("div");
      challengeDiv.className = "p-3 border rounded-lg mb-2 bg-white text-gray-800 shadow";

      let content = `
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium">${challenge.challenger} vs ${challenge.opponent}</p>
            <p class="text-sm text-gray-500">Status: ${challenge.status}</p>
          </div>
      `;

      // Show Accept/Deny buttons if it's pending and issued TO loggedInPlayerId
      if (challenge.status === "pending" && isOpponent) {
        content += `
          <div class="flex space-x-2">
            <button class="accept-btn px-3 py-1 bg-green-500 text-white rounded">Accept</button>
            <button class="deny-btn px-3 py-1 bg-red-500 text-white rounded">Deny</button>
          </div>
        `;
      }

      content += `</div>`;
      challengeDiv.innerHTML = content;

      // Append to appropriate tab
      if (challenge.status === "pending") {
        pendingList.appendChild(challengeDiv);
      } else if (isChallenger && challenge.status === "active") {
        sentList.appendChild(challengeDiv);
      } else {
        historyList.appendChild(challengeDiv);
      }

      // Add event listeners for Accept/Deny
      const acceptBtn = challengeDiv.querySelector(".accept-btn");
      const denyBtn = challengeDiv.querySelector(".deny-btn");

      if (acceptBtn) {
        acceptBtn.addEventListener("click", async () => {
          await updateChallengeStatus(challenge.id, "active");
          challengeDiv.querySelector(".text-gray-500").textContent = "Status: active";
          acceptBtn.remove();
          denyBtn.remove();
        });
      }

      if (denyBtn) {
        denyBtn.addEventListener("click", async () => {
          await updateChallengeStatus(challenge.id, "denied");
          challengeDiv.querySelector(".text-gray-500").textContent = "Status: denied";
          acceptBtn.remove();
          denyBtn.remove();
        });
      }
    });
  } catch (error) {
    console.error("Error loading challenges:", error);
  }
}

async function updateChallengeStatus(challengeId, newStatus) {
  try {
    const challengeRef = doc(db, "challenges", challengeId);
    await updateDoc(challengeRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    console.log(`Challenge ${challengeId} updated to ${newStatus}`);
  } catch (err) {
    console.error(`Error updating challenge ${challengeId}:`, err);
  }
}