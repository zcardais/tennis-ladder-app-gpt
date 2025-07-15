const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function normalizePlayers() {
  const invitesSnap = await db.collection("ladderInvites").get();
  const invitesByEmail = {};
  invitesSnap.forEach(doc => {
    const data = doc.data();
    invitesByEmail[data.email] = doc.id;
  });

  const playersSnap = await db.collection("players").get();
  let updatedCount = 0;

  for (const doc of playersSnap.docs) {
    const player = doc.data();
    const update = {};

    if (!player.email) continue;

    update.firstName = player.firstName || "Unknown";
    update.lastName = player.lastName || "Unknown";
    update.ladderId = player.ladderId || "missing";
    update.rank = typeof player.rank === "number" ? player.rank : 999;

    // Try to find inviteId by matching email
    if (!player.inviteId) {
      update.inviteId = invitesByEmail[player.email] || null;
    }

    await doc.ref.update(update);
    console.log(`✅ Normalized: ${player.email}`);
    updatedCount++;
  }

  console.log(`🎉 Done. Updated ${updatedCount} players.`);
}

normalizePlayers().catch(console.error);