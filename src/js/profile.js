import { auth } from "../firebase-setup.js";
import { doc, getDocs, getDoc, updateDoc, collection, query, where } from "firebase/firestore";
import { db, getCurrentUID } from "../firebase-setup.js";

export function init() {
  console.log('Profile loaded');

  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "/auth.html";
      return;
    }

    const uid = user.uid;
    const playerQuery = query(collection(db, "players"), where("uid", "==", uid));
    const snap = await getDocs(playerQuery);
    if (snap.empty) return;

    const playerDoc = snap.docs[0];
    const playerData = playerDoc.data();
    const playerId = playerDoc.id;

    const ladderIds = playerData.ladders || [];
    const primaryLadderId = playerData.primaryLadderId || "";

    const ladderSelect = document.getElementById("primary-ladder");
    ladderSelect.innerHTML = "";

    for (const lid of ladderIds) {
      const ladderSnap = await getDoc(doc(db, "ladders", lid));
      if (ladderSnap.exists()) {
        const ladder = ladderSnap.data();
        const opt = document.createElement("option");
        opt.value = lid;
        opt.textContent = ladder.name || lid;
        if (lid === primaryLadderId) opt.selected = true;
        ladderSelect.appendChild(opt);
      }
    }

    ladderSelect.addEventListener("change", async e => {
      const newPrimary = e.target.value;
      await updateDoc(doc(db, "players", playerId), {
        primaryLadderId: newPrimary
      });
      console.log(`Updated primaryLadderId to ${newPrimary}`);
    });
  });
}