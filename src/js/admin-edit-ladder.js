import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase-setup.js";

export async function init() {
  console.log("Admin Edit Ladder page loaded");

  const urlParams = new URLSearchParams(window.location.search);
  const ladderId = urlParams.get("id");

  if (!ladderId) {
    alert("No ladder ID provided in URL.");
    return;
  }

  console.log("Fetching ladder with ID:", ladderId);

  const docRef = doc(db, "ladders", ladderId);

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const ladder = docSnap.data();
      console.log("Ladder data:", ladder);

      // Populate form fields
      document.getElementById("ladder-name").value = ladder.name || "";
      document.getElementById("start-date").value = ladder.startDate || "";
      document.getElementById("end-date").value = ladder.endDate || "";
      document.getElementById("max-challenges").value = ladder.maxChallenges || 1;
      document.getElementById("accept-time").value = ladder.acceptTime || 24;
      document.getElementById("auto-win").checked = ladder.autoWin || false;
      document.getElementById("match-deadline").value = ladder.matchDeadline || 7;
      document.getElementById("ranking-type").value = ladder.rankingType || "fixed";
      document.getElementById("match-type").value = ladder.matchType || "singles";

    } else {
      alert("Ladder not found.");
      console.error("No such ladder in Firestore.");
    }
  } catch (error) {
    console.error("Error fetching ladder:", error);
    alert("Failed to fetch ladder details.");
  }
}