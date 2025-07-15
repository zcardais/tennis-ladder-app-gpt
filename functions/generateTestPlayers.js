// generateTestPlayers.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// 🧠 CONFIGURE THESE VALUES
const BASE_EMAIL = "zcardais+player"; // will append 1, 2, etc.
const NUM_PLAYERS = 10;
const LADDER_ID = "9BhwXD76zeRdES3db25m"; // <-- Insert your ladderId

// 🔥 Initialize Firebase
const firebaseConfig = {
  // your Firebase config here
  apiKey: "AIzaSyCxA8WgCWmB9azIssQyhVXb_25UwzahqGw",
  authDomain: "tennis-ladder-app.firebaseapp.com",
  projectId: "tennis-ladder-app",
  storageBucket: "tennis-ladder-app.firebasestorage.app",
  messagingSenderId: "998277642882",
  appId: "1:998277642882:web:6ec2cc3b38bb56fbd9929b"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateTestPlayers() {
  for (let i = 1; i <= NUM_PLAYERS; i++) {
    const email = `${BASE_EMAIL}${i}@gmail.com`;
    const firstName = `Player${i}`;
    const lastName = `Test`;

    // Add to "players" collection
    const playerRef = doc(collection(db, "players"));
    await setDoc(playerRef, {
      email,
      firstName,
      lastName,
      rank: 0,
      ladderId: LADDER_ID,
      inviteId: uuidv4(), // optional: attach here too
    });

    // Add to "ladderInvites" collection
    const inviteRef = doc(collection(db, "ladderInvites"));
    await setDoc(inviteRef, {
      email,
      inviteId: uuidv4(),
      ladderId: LADDER_ID,
      createdAt: new Date(),
    });

    console.log(`✅ Created test player: ${email}`);
  }

  console.log("🎉 Done generating test players.");
}

generateTestPlayers().catch(console.error);