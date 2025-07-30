import { getDocs, collection, doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../src/firebase-setup.js"; // adjust if needed

// One-time script to remove 'ladderId' field from all players
async function removeLadderIdFromPlayers() {
  const playersSnap = await getDocs(collection(db, "players"));

  for (const playerDoc of playersSnap.docs) {
    const playerRef = doc(db, "players", playerDoc.id);
    const data = playerDoc.data();

    if ("ladderId" in data) {
      await updateDoc(playerRef, {
        ladderId: deleteField()
      });
      console.log(`✅ Removed ladderId from ${playerDoc.id}`);
    }
  }

  console.log("🎉 All player ladderId fields removed.");
}

removeLadderIdFromPlayers();