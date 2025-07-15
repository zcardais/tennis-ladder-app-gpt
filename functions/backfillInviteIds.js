const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Replace with your service account file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backfillInviteIds() {
  const invitesSnap = await db.collection("ladderInvites").get();
  let updatedCount = 0;

  for (const doc of invitesSnap.docs) {
    const inviteId = doc.id;
    const { email } = doc.data();

    const playersSnap = await db.collection("players")
      .where("email", "==", email)
      .get();

    if (!playersSnap.empty) {
      const playerDoc = playersSnap.docs[0];
      const playerData = playerDoc.data();

      if (!playerData.inviteId) {
        await playerDoc.ref.update({ inviteId });
        console.log(`✅ Backfilled inviteId for ${email}`);
        updatedCount++;
      } else {
        console.log(`ℹ️ Already has inviteId: ${email}`);
      }
    } else {
      console.log(`⚠️ No player found for email: ${email}`);
    }
  }

  console.log(`🎉 Done. Updated ${updatedCount} players.`);
}

backfillInviteIds().catch(console.error);