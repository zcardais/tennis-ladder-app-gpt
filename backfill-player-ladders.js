import { getDocs, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase-setup.js"; // Adjust path if needed

async function backfillPlayerLadders() {
  const laddersSnap = await getDocs(collection(db, "ladders"));

  for (const ladderDoc of laddersSnap.docs) {
    const ladderId = ladderDoc.id;
    const participants = ladderDoc.data().participants || [];

    for (const playerId of participants) {
      const playerRef = doc(db, "players", playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists()) {
        console.warn(`⚠️ Player not found: ${playerId}`);
        continue;
      }

      const playerData = playerSnap.data();
      const existingLadders = playerData.ladders || [];

      if (!existingLadders.includes(ladderId)) {
        const updatedLadders = [...new Set([...existingLadders, ladderId])];
        await updateDoc(playerRef, { ladders: updatedLadders });
        console.log(`✅ Updated ${playerId}: added ladder ${ladderId}`);
      }
    }
  }

  console.log("🎉 Player ladder backfill complete.");
}

backfillPlayerLadders();