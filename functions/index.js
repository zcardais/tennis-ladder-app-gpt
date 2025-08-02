const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
sgMail.setApiKey(process.env.SENDGRID_API_KEY ||
  functions.config().sendgrid.api_key);

exports.sendLadderInvite = functions
    .region("us-central1")
    .firestore.document("ladderInvites/{inviteId}")
    .onCreate(async (snap, ctx) => {
      const invite = snap.data();
      const inviteId = ctx.params.inviteId;
      const baseUrl = functions.config().app.base_url;
      const signupUrl = `${baseUrl}/auth.html?inviteId=${inviteId}`;

      const msg = {
        to: invite.email,
        from: {
          email: "invitations@challengeking.io",
          name: "ChallengeKing",
        },
        subject: "You're Invited to Join a Tennis Ladder",
        html: `
        <p>Hi ${invite.firstName},</p>
        <p>You’ve been invited to join a tennis ladder.</p>
        <p><a href="${signupUrl}">Join Now</a></p>
        <hr>
        <p style="font-size:12px;color:#888;">
          ChallengeKing · Do not reply to this message.
        </p>
      `,
      };

      try {
        await sgMail.send(msg);
        console.log("✅ Invite email sent to", invite.email);

        // Attach inviteId to matching player (if exists)
        try {
          const playersRef = admin.firestore().collection("players");
          const q = playersRef.where("email", "==", invite.email);
          const snap = await q.get();
          if (!snap.empty) {
            const playerDoc = snap.docs[0];
            await playerDoc.ref.update({inviteId: inviteId});
            console.log(
                `✅ Linked inviteId ${inviteId} to player ${invite.email}`,
            );
          } else {
            console.warn(`⚠️ No player found for invite email ${invite.email}`);
          }
        } catch (err) {
          console.error("Error linking inviteId to player:", err);
        }
      } catch (e) {
        console.error("❌ SendGrid error:", e.toString());
      }
    });

exports.resendLadderInvite = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
      const {email, inviteId} = req.body;

      if (!email || !inviteId) {
        return res.status(400).json({error: "Missing email or inviteId"});
      }

      try {
        const inviteSnap = await admin.firestore()
            .collection("ladderInvites")
            .doc(inviteId)
            .get();

        if (!inviteSnap.exists) {
          return res.status(404).json({error: "Invite not found"});
        }

        const invite = inviteSnap.data();
        const baseUrl = functions.config().app.base_url;
        const signupUrl = `${baseUrl}/auth.html?inviteId=${inviteId}`;

        const msg = {
          to: email,
          from: {
            email: "invitations@challengeking.io",
            name: "ChallengeKing",
          },
          subject: "Reminder: Join the Tennis Ladder",
          html: `
          <p>Hi ${invite.firstName || ""},</p>
          <p>This is a reminder to join your tennis ladder.</p>
          <p><a href="${signupUrl}">Join Now</a></p>
          <hr>
          <p style="font-size:12px;color:#888;">
            ChallengeKing · Do not reply to this message.
          </p>
        `,
        };

        await sgMail.send(msg);
        return res.status(200).json({status: "Invite resent."});
      } catch (err) {
        console.error("Error resending invite:", err);
        return res.status(500).json({error: err.message});
      }
    });

exports.sendChallengeEmail = require("./sendChallengeEmail");
