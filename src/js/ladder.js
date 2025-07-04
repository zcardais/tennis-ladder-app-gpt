import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase-setup.js";

console.log("Ladders page loaded");

const params = new URLSearchParams(window.location.search);
const ladderId = params.get("ladderId");
console.log("URL ladderId:", ladderId);

const ladderName = document.getElementById("ladder-name");
const startDate = document.getElementById("start-date");
const endDate = document.getElementById("end-date");
const ladderType = document.getElementById("ladder-type");
const joinButton = document.getElementById("join-button");
const rankingsList = document.getElementById("rankings-list");

const loggedInPlayerId = "tyler"; // TEMP placeholder for testing

async function loadLadder() {
  if (!ladderId) {
	ladderName.textContent = "Error: Ladder ID not found in URL";
	return;
  }

  try {
	const docRef = doc(db, "ladders", ladderId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
	  const data = docSnap.data();
	  console.log("Ladder data:", data);

	  ladderName.textContent = data.name || "Untitled Ladder";
	  startDate.textContent = data.startDate || "TBD";
	  endDate.textContent = data.endDate || "TBD";
	  ladderType.textContent = data.type || "TBD";

	  let participants = data.participants || [];
	  const alreadyJoined = participants.includes(loggedInPlayerId);

	  // Update Join button state
	  if (alreadyJoined) {
		joinButton.textContent = "Already Joined";
		joinButton.classList.add("bg-gray-400", "cursor-not-allowed");
		joinButton.disabled = true;
	  } else {
		joinButton.textContent = "Join Ladder";
		joinButton.addEventListener("click", async () => {
		  try {
			await updateDoc(docRef, {
			  participants: arrayUnion(loggedInPlayerId)
			});
			console.log(`Player ${loggedInPlayerId} joined ladder.`);
			joinButton.textContent = "Joined!";
			joinButton.classList.add("bg-gray-400", "cursor-not-allowed");
			joinButton.disabled = true;

			participants.push(loggedInPlayerId);
			renderRankings(participants);
		  } catch (error) {
			console.error("Error joining ladder:", error);
			alert("Failed to join ladder. Try again.");
		  }
		});
	  }

	  renderRankings(participants);

	} else {
	  ladderName.textContent = "Ladder not found";
	  console.error("No such ladder document.");
	}
  } catch (error) {
	console.error("Error loading ladder:", error);
	ladderName.textContent = "Error loading ladder";
  }
}

function renderRankings(participants) {
  rankingsList.innerHTML = "";
  if (participants.length > 0) {
	participants.forEach((playerId, index) => {
	  const playerDiv = document.createElement("div");
	  playerDiv.className = "flex justify-between items-center p-3 border-b border-gray-200";
	  playerDiv.innerHTML = `
		<span class="font-semibold text-gray-800">#${index + 1}</span>
		<span class="text-gray-700">${playerId}</span>
	  `;
	  rankingsList.appendChild(playerDiv);
	});
  } else {
	rankingsList.innerHTML = `<p class="text-gray-500">No rankings to display yet.</p>`;
  }
}

export function init() {
  loadLadder();
}