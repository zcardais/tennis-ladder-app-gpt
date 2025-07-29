import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./src/firebase-setup.js"; // adjust if needed

async function backfillPlayerUIDs() {
  const playersRef = collection(db, "players");
  const snapshot = await getDocs(playersRef);

  for (const playerDoc of snapshot.docs) {
    const data = playerDoc.data();

    if (!data.uid) {
      const playerId = playerDoc.id;
      console.log(`⛔ Missing uid for doc ID: ${playerId}`);

      const playerRef = doc(db, "players", playerId);
      await updateDoc(playerRef, { uid: playerId });

      console.log(`✅ Patched uid for player ${playerId}`);
    }
  }

  console.log("🎉 Backfill complete.");
}

backfillPlayerUIDs();