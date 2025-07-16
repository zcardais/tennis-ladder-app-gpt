const admin = require("firebase-admin");
const {v4: uuidv4} = require("uuid"); // install this if not already: npm install uuid
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function assignInviteIds() {
  const playersSnap = await db.collection("players").get();
  let createdCount = 0;

  for (const doc of playersSnap.docs) {
    const player = doc.data();
    const playerRef = doc.ref;

    if (player.inviteId) {
      console.log(`ℹ️ Already has inviteId: ${player.email}`);
      continue;
    }

    const newInviteId = uuidv4(); // or use doc.id if you prefer
    const inviteData = {
      email: player.email,
      firstName: player.firstName,
      lastName: player.lastName,
      ladderId: player.ladderId,
      username: player.username || player.email.split("@")[0],
      sentAt: new Date(),
      status: "backfilled",
    };

    await db.collection("ladderInvites").doc(newInviteId).set(inviteData);
    await playerRef.update({inviteId: newInviteId});

    console.log(`✅ Created invite for: ${player.email}`);
    createdCount++;
  }

  console.log(`🎉 Done. Created ${createdCount} new inviteIds.`);
}

assignInviteIds().catch(console.error);
