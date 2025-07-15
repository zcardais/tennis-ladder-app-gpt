const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

async function auditPlayers() {
  console.log('🔍 Starting player audit...');

  const authUsers = new Map();
  const authList = await getAuth().listUsers();
  for (const user of authList.users) {
    authUsers.set(user.email, user.uid);
  }

  const playersSnap = await db.collection('players').get();
  const missingInAuth = [];
  const missingLadderId = [];

  for (const playerDoc of playersSnap.docs) {
    const player = playerDoc.data();
    const playerId = playerDoc.id;

    if (!authUsers.has(player.email)) {
      missingInAuth.push({ email: player.email, playerId });
    }

    if ((player.ladderId === 'missing' || !player.ladderId) &&
        Array.isArray(player.ladders) &&
        player.ladders.length > 0) {
      const defaultLadderId = player.ladders[0];
      await db.collection('players').doc(playerId).update({ ladderId: defaultLadderId });
      missingLadderId.push({ email: player.email, fixedTo: defaultLadderId });
      player.ladderId = defaultLadderId;
    }

    // Check participants[] array in the ladder
    if (player.ladderId) {
      const ladderRef = db.collection('ladders').doc(player.ladderId);
      const ladderSnap = await ladderRef.get();
      if (ladderSnap.exists) {
        const ladderData = ladderSnap.data();
        const participants = ladderData.participants || [];
        if (!participants.includes(playerId)) {
          await ladderRef.update({
            participants: [...participants, playerId]
          });
          console.log(`🔁 Added ${player.email} to participants[] of ladder ${player.ladderId}`);
        }
      } else {
        console.warn(`⚠️ Ladder ${player.ladderId} not found for player ${player.email}`);
      }
    }
  }

  const usersSnap = await db.collection('users').get();
  const usersSet = new Set(usersSnap.docs.map(doc => doc.id));
  const missingUsers = [];

  for (const playerDoc of playersSnap.docs) {
    const playerId = playerDoc.id;
    if (authUsers.has(playerDoc.data().email) && !usersSet.has(playerId)) {
      missingUsers.push(playerDoc.data().email);
    }
  }

  console.log('✅ Audit complete.\n');
  console.log('📭 Players missing from Firebase Auth:', missingInAuth.length);
  missingInAuth.forEach(p => console.log(`  ❌ ${p.email} (playerId: ${p.playerId})`));

  console.log('\n🛠️ Fixed missing ladderId for:', missingLadderId.length);
  missingLadderId.forEach(p => console.log(`  ✅ ${p.email} → ladderId: ${p.fixedTo}`));

  console.log('\n👤 Players missing from users collection:', missingUsers.length);
  missingUsers.forEach(email => console.log(`  🚫 ${email}`));

  // Automatically create users doc for missing users
  for (const playerDoc of playersSnap.docs) {
    const player = playerDoc.data();
    const playerId = playerDoc.id;
    if (authUsers.has(player.email) && !usersSet.has(playerId)) {
      await db.collection('users').doc(playerId).set({
        email: player.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🆕 Created users doc for ${player.email}`);
    }
  }
}

auditPlayers().catch(err => console.error('🔥 Error in auditPlayers:', err));