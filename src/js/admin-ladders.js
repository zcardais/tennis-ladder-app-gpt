import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase-setup.js";

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
        <p><span class="font-semibold">Type:</span> ${ladder.type || "N/A"}</p>
        <div class="flex space-x-2">
          <button class="edit-btn bg-blue-600 text-white px-3 py-1 rounded">Edit</button>
          <button class="delete-btn bg-red-600 text-white px-3 py-1 rounded">Delete</button>
        </div>
      `;

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