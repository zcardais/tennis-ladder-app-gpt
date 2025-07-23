import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase-setup.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";


const auth = getAuth();
let loggedInPlayerId = null;
let ladderLoaded = false;
let authTriggered = false;

onAuthStateChanged(auth, (user) => {
  console.log("🔁 Auth state change detected");
  if (authTriggered) {
    console.log("⛔ Duplicate auth event blocked");
    return;
  }
  authTriggered = true;

  if (user) {
    loggedInPlayerId = user.uid;
    loadLadder();
  } else {
    window.location.href = "auth.html";
  }
});

console.log("Ladders page loaded");

const params = new URLSearchParams(window.location.search);
const ladderId = params.get("ladderId");
console.log("URL ladderId:", ladderId);

const ladderName = document.getElementById("ladder-name");
const rankingsList = document.getElementById("rankings-list");


async function loadLadder() {
  if (ladderLoaded) {
    console.log("⛔ Skipping duplicate loadLadder");
    return;
  }
  ladderLoaded = true;

  console.log("🏓 loadLadder fired");
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
	  const start = data.startDate || "TBD";
	  const end = data.endDate || "TBD";
	  const seasonDatesEl = document.getElementById("season-dates");
	  if (seasonDatesEl) seasonDatesEl.textContent = `Start date: ${start}`;

	  const endsInEl = document.getElementById("ends-in");
	  if (start !== "TBD" && end !== "TBD") {
		const endDate = new Date(end);
		const today = new Date();
		const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
		endsInEl.textContent = `Ends in ${diffDays} days`;
	  } else {
		endsInEl.textContent = "End date TBD";
	  }

	  const rankIdx = data.participants.indexOf(loggedInPlayerId);
	  const yourRankEl = document.getElementById("your-rank");
	  if (yourRankEl) yourRankEl.textContent = rankIdx >= 0 ? `${rankIdx + 1}` : "–";

	  const playerRef = doc(db, "players", loggedInPlayerId);
	  const playerSnap = await getDoc(playerRef);
	  if (playerSnap.exists()) {
		const p = playerSnap.data();
		const nameEl = document.getElementById("your-name");
		const ratingEl = document.getElementById("your-rating");
		if (nameEl) nameEl.textContent = `${p.firstName || ""} ${p.lastName || ""}`.trim();
		if (ratingEl) ratingEl.textContent = `${p.rating || "–"}`;
	  }

	  let participants = [...new Set(data.participants || [])];
	  console.log("🎯 Final deduplicated participants:", participants);
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

async function renderRankings(participants) {
  // Prevent duplicate table renders if called more than once
    if (window._ladderRankingsRendered) {
      console.warn("renderRankings: skipped duplicate render");
      return;
    }
    window._ladderRankingsRendered = true;
  const list = document.getElementById("rankings-list");
  list.innerHTML = "";

  // Compute win/loss record for each participant
  const matchesRef = collection(db, "ladders", ladderId, "matches");
  const matchesQuery = query(matchesRef, where("status", "==", "complete"));
  const matchesSnap = await getDocs(matchesQuery);
  const recordMap = {};
  matchesSnap.forEach(mDoc => {
    const { winnerId, loserId } = mDoc.data();
    recordMap[winnerId] = recordMap[winnerId] || { wins: 0, losses: 0 };
    recordMap[loserId]  = recordMap[loserId]  || { wins: 0, losses: 0 };
    recordMap[winnerId].wins++;
    recordMap[loserId].losses++;
  });

  if (participants.length === 0) {
    list.innerHTML = `<li class="text-center text-gray-500 py-4">No rankings to display yet.</li>`;
    return;
  }

  // Fetch all challenges for this ladder by the current player
  const challengeSnap = await getDocs(query(
    collection(db, "challenges"),
    where("ladderId", "==", ladderId),
    where("challenger", "==", loggedInPlayerId),
    where("status", "in", ["pending", "accepted"])
  ));
  const activeChallengeMap = {};
  challengeSnap.forEach(doc => {
    const data = doc.data();
    activeChallengeMap[data.opponent] = doc.id;
  });

  for (let i = 0; i < participants.length; i++) {
    const playerId = participants[i];
    const playerRef = doc(db, "players", playerId);
    const playerSnap = await getDoc(playerRef);

    let fullName = playerId;
    if (playerSnap.exists()) {
      const playerData = playerSnap.data();
      fullName = `${playerData.firstName || ""} ${playerData.lastName || ""}`.trim();
    }

    const isSelf = playerId === loggedInPlayerId;
    let challengeCell = "";
    if (!isSelf) {
      const challengeId = activeChallengeMap[playerId];
      if (challengeId) {
        challengeCell = `<button data-id="${challengeId}" class="withdraw-btn px-3 py-1 text-sm font-medium text-white rounded bg-yellow-500 hover:bg-yellow-600">Withdraw</button>`;
      } else {
        challengeCell = `
        <button
          data-id="${playerId}"
          class="issue-btn px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"
        >
          Challenge
        </button>`;
      }
    }

    const li = document.createElement("li");
    li.className = "bg-white rounded-xl p-4 flex items-center justify-between shadow";
    li.innerHTML = `
      <div class="flex items-center space-x-4">
        <span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-200 text-white font-bold">
          ${i + 1}
        </span>
        <div class="flex flex-col">
          <span class="font-medium text-gray-900">${fullName}</span>
          <span class="text-sm text-gray-600">${recordMap[playerId] ? `${recordMap[playerId].wins}–${recordMap[playerId].losses}` : '–'}</span>
        </div>
      </div>
      ${challengeCell}
    `;
    list.appendChild(li);
  }

  // Bind all challenge buttons
  list.querySelectorAll(".issue-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-id");
      const targetRow = btn.closest("li");
      const name = targetRow.querySelector("div > div > span.font-medium").textContent;
      try {
        await addDoc(collection(db, "challenges"), {
          ladderId,
          challenger: loggedInPlayerId,
          opponent: targetId,
          status: "pending",
          dateIssued: new Date()
        });
        alert(`Challenge sent to ${name}!`);
      } catch (err) {
        console.error("Error issuing challenge:", err);
        alert("Failed to issue challenge. Please try again.");
      }
    });
  });

  list.querySelectorAll(".withdraw-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const challengeId = btn.getAttribute("data-id");
      if (confirm("Withdraw this challenge?")) {
        try {
          await updateDoc(doc(db, "challenges", challengeId), {
            status: "withdrawn",
            withdrawnAt: new Date()
          });
          alert("Challenge withdrawn.");
          loadLadder(); // Refresh the list
        } catch (err) {
          console.error("Withdraw failed:", err);
          alert("Failed to withdraw. Please try again.");
        }
      }
    });
  });
}

export function init() {
  // No need to call loadLadder directly; handled by auth observer
  // Confirmed: renderRankings is only called from within loadLadder.
}