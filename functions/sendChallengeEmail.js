const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

const db = admin.firestore();

// Store this in Firebase config or .env
sgMail.setApiKey(functions.config().sendgrid.api_key);

exports.sendChallengeEmail = functions.firestore
  .document("challenges/{challengeId}")
  .onCreate(async (snap, context) => {
    const challenge = snap.data();

    if (challenge.status !== "pending") return null;

    const { challenger, opponent, ladderId } = challenge;

    try {
      // Fetch opponent info
      const opponentSnap = await db.collection("players").doc(opponent).get();
      if (!opponentSnap.exists) return console.warn("Opponent not found");

      const opponentData = opponentSnap.data();

      // Fetch challenger info
      const challengerSnap = await db.collection("players").doc(challenger).get();
      const challengerData = challengerSnap.exists ? challengerSnap.data() : { firstName: "A player" };

      // Fetch ladder info
      const ladderSnap = await db.collection("ladders").doc(ladderId).get();
      const ladderData = ladderSnap.exists ? ladderSnap.data() : { name: "a ladder" };

      const msg = {
        to: opponentData.email,
        from: "invitations@challengeking.io", // Update this to your verified sender
        subject: `New Challenge from ${challengerData.firstName} on ${ladderData.name}`,
        text: `${challengerData.firstName} has challenged you in the ${ladderData.name} ladder. Please log in to accept or deny the challenge.`,
        html: `
          <p><strong>${challengerData.firstName}</strong> has challenged you in <strong>${ladderData.name}</strong>.</p>
          <p>Please log in to <a href="https://your-app-url.com/challenges.html">accept or deny</a> the challenge.</p>
        `,
      };

      await sgMail.send(msg);
      console.log(`📬 Email sent to ${opponentData.email}`);
    } catch (err) {
      console.error("❌ Failed to send challenge email:", err);
    }

    return null;
  });