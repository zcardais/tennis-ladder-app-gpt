const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function patchBackfilledInvites() {
  const invitesSnap = await db.collection("ladderInvites").where("status", "==", "backfilled").get();
  let patched = 0;

  for (const doc of invitesSnap.docs) {
    const data = doc.data();
    const updates = {};

    if (data.ladderId && !data.ladders) {
      updates.ladders = [data.ladderId];
    }

    // Promote to 'accepted' if player exists
    const playerSnap = await db.collection("players").where("email", "==", data.email).get();
    if (!playerSnap.empty) {
      updates.status = "accepted";
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`✅ Patched: ${data.email}`);
      patched++;
    }
  }

  console.log(`🎉 Done. Patched ${patched} invite records.`);
}

patchBackfilledInvites().catch(console.error);