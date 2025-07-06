import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { firebaseConfig } from "./firebase-setup.js"; // adjust if needed

console.log("⚡ Running Firestore score migration...");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateScores() {
  const challengesRef = collection(db, "challenges");
  const snapshot = await getDocs(challengesRef);

  let updatedCount = 0;

  for (const challengeDoc of snapshot.docs) {
	const data = challengeDoc.data();

	if (data.score && Array.isArray(data.score.sets)) {
	  const oldSets = data.score.sets;

	  // Check if it's the old string format
	  if (typeof oldSets[0] === "string") {
		console.log(`🏃 Migrating challenge: ${challengeDoc.id}`);

		const newSets = oldSets.map((setStr) => {
		  const parts = setStr.split("-");
		  return {
			you: parseInt(parts[0] || "0"),
			them: parseInt(parts[1] || "0")
		  };
		});

		// Update Firestore document
		await updateDoc(doc(db, "challenges", challengeDoc.id), {
		  "score.sets": newSets
		});

		console.log(`✅ Migrated ${challengeDoc.id}`);
		updatedCount++;
	  }
	}
  }

  console.log(`🎉 Migration complete. Total updated: ${updatedCount}`);
}

migrateScores().catch((err) => {
  console.error("🔥 Migration failed:", err);
});