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
      const signupUrl = `https://tennis-ladder-app.web.app/auth.html?inviteId=${inviteId}`;

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
      } catch (e) {
        console.error("❌ SendGrid error:", e.toString());
      }
    });
