import { collection, getDocs, deleteDoc, doc, writeBatch, updateDoc, query, where } from "firebase/firestore";
import { db } from "../firebase-setup.js";

export async function init() {
  console.log("Admin Ladders page loaded");

  const laddersList = document.getElementById("ladders-list");
  laddersList.innerHTML = "<p>Loading ladders...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "ladders"));

    if (querySnapshot.empty) {
      laddersList.innerHTML = "<p class='text-gray-600'>No ladders found.</p>";
      return;
    }

    laddersList.innerHTML = ""; // Clear loader

    querySnapshot.forEach((docSnap) => {
      const ladder = docSnap.data();
      console.log("Firestore ladder doc:", ladder);
      const ladderId = docSnap.id;

      const card = document.createElement("div");
      card.className =
        "bg-white rounded-lg shadow-md p-4 mb-4 space-y-2";

      card.innerHTML = `
        <h3 class="text-lg font-bold">${ladder.name || "Untitled Ladder"}</h3>
        <p><span class="font-semibold">Dates:</span> ${ladder.startDate || "TBD"} – ${ladder.endDate || "TBD"}</p>
        <p><span class="font-semibold">Sport:</span> ${ladder.sport || "Tennis"}</p>
        <p><span class="font-semibold">Type:</span> ${ladder.type || "N/A"}</p>
        <div class="flex space-x-2">
          <button class="edit-btn bg-blue-600 text-white px-3 py-1 rounded">Edit</button>
          <button class="delete-btn bg-red-600 text-white px-3 py-1 rounded">Delete</button>
          <a href="players.html?ladderId=${ladderId}" class="bg-indigo-600 text-white px-3 py-1 rounded">Manage Players</a>
        </div>
      `;

      // Clone Admin Controls template
      const template = document.getElementById("admin-controls-template");
      const clone = template.content.cloneNode(true);
      const btn = clone.querySelector(".btn-admin-controls");
      const panel = clone.querySelector(".admin-controls-panel");
      // Set ladder ID on controls
      btn.dataset.ladderId = ladderId;
      panel.id = `controls-${ladderId}`;
      // Toggle panel visibility
      btn.addEventListener("click", () => panel.classList.toggle("hidden"));
      // Reference the Edit Scores container
      const editContainer = clone.querySelector("#edit-scores-container");
      // Populate Edit Scores list
      (async () => {
        const matchesSnap = await getDocs(query(
          collection(db, "challenges"),
          where("ladderId", "==", ladderId),
          where("status", "==", "completed")
        ));
        matchesSnap.forEach(matchDoc => {
          const m = matchDoc.data();
          const sets = m.score?.sets || [];
          const scoreStr = sets.map(s => `${s.you}-${s.them}`).join(", ");
          const displayScore = m.rawScore || scoreStr;
          const matchDiv = document.createElement("div");
          matchDiv.className = "flex justify-between items-center mb-2";
          matchDiv.innerHTML = `
            <span>${m.challenger} def. ${m.opponent} | ${displayScore}</span>
            <button class="edit-score-btn px-2 py-1 bg-blue-500 text-white rounded" data-match-id="${matchDoc.id}">
              Edit
            </button>
          `;
          editContainer.appendChild(matchDiv);
        });
        // Wire up edit buttons
        editContainer.querySelectorAll(".edit-score-btn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const matchId = btn.dataset.matchId;
            const newWinner = prompt("Enter new winner:");
            const newScoreStr = prompt("Enter new score (e.g., 6-4,7-5):");
            if (!newWinner || !newScoreStr) return;
            // For simplicity, store newScoreStr as a raw string in a new field
            await updateDoc(doc(db, "challenges", matchId), { 
              winner: newWinner, 
              rawScore: newScoreStr,
              status: "completed"
            });
            await recalc(ladderId);
            alert("Match updated and rankings recalculated.");
            location.reload();
          });
        });
      })();
      // Hook up Reset Ladder
      const resetBtn = clone.querySelector("#reset-ladder-button");
      resetBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to reset this ladder?")) return;
        const batch = writeBatch(db);
        // Delete matches
        const matchesSnap = await getDocs(query(collection(db, "matches"), where("ladderId", "==", ladderId)));
        matchesSnap.forEach(m => batch.delete(doc(db, "matches", m.id)));
        // Reset player ranks
        const ladderDoc = await getDocs(query(collection(db, "ladders"), where("__name__", "==", ladderId)));
        const participants = ladderDoc.docs[0].data().participants || [];
        participants.forEach(pid => batch.update(doc(db, "players", pid), { rank: 0 }));
        // Delete challenges
        const challengesSnap = await getDocs(query(collection(db, "challenges"), where("ladderId", "==", ladderId)));
        challengesSnap.forEach(ch => batch.delete(doc(db, "challenges", ch.id)));
        await batch.commit();
        alert("Ladder has been reset.");
        location.reload();
      });
      // Append controls
      card.appendChild(clone);

      // Handle Edit button
      card.querySelector(".edit-btn").addEventListener("click", () => {
        console.log(`Navigating to edit-ladder.html?id=${ladderId}`);
        window.location.href = `edit-ladder.html?id=${ladderId}`;
      });

      // Handle Delete button
      card.querySelector(".delete-btn").addEventListener("click", async () => {
        const confirmDelete = confirm(
          `Are you sure you want to delete "${ladder.name}"? This cannot be undone.`
        );
        if (confirmDelete) {
          try {
            await deleteDoc(doc(db, "ladders", ladderId));
            console.log(`Ladder "${ladder.name}" deleted`);
            laddersList.removeChild(card); // Remove from UI
          } catch (error) {
            console.error("Error deleting ladder:", error);
            alert("Failed to delete ladder. See console for details.");
          }
        }
      });

      laddersList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching ladders:", error);
    laddersList.innerHTML = "<p class='text-red-500'>Failed to load ladders.</p>";
  }
}