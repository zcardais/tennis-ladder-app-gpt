import { db } from "./firebase-setup.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

console.log("✅ Edit Ladder JS loaded");

export async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const ladderId = urlParams.get("id");
  if (!ladderId) {
    console.error("❌ No ladder ID in URL");
    return;
  }
  console.log("🔍 Editing ladder with ID:", ladderId);

  const form = document.getElementById("edit-ladder-form");
  const nameInput = document.getElementById("ladder-name");
  const descInput = document.getElementById("description");
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const rankInput = document.getElementById("ranking-system");
  const maxInput = document.getElementById("max-players");
  const adminNamesInput = document.getElementById("admin-names");
  const adminEmailsInput = document.getElementById("admin-emails");
  const allowJoinInput = document.getElementById("allow-joining");

  try {
    const docRef = doc(db, "ladders", ladderId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.error("❌ Ladder not found in Firestore");
      return;
    }
    const data = docSnap.data();
    nameInput.value = data.name || "";
    descInput.value = data.description || "";
    startInput.value = data.startDate || "";
    endInput.value = data.endDate || "";
    rankInput.value = data.rankingSystem || "bump";
    maxInput.value = data.maxPlayers || "";
    adminNamesInput.value = data.adminNames || "";
    adminEmailsInput.value = data.adminEmails || "";
    allowJoinInput.checked = !!data.allowJoining;
  } catch (error) {
    console.error("🔥 Error loading ladder:", error);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedData = {
      name: nameInput.value.trim(),
      description: descInput.value.trim(),
      startDate: startInput.value,
      endDate: endInput.value,
      rankingSystem: rankInput.value,
      maxPlayers: parseInt(maxInput.value) || 0,
      adminNames: adminNamesInput.value.trim(),
      adminEmails: adminEmailsInput.value.trim(),
      allowJoining: allowJoinInput.checked,
      updatedAt: serverTimestamp()
    };

    try {
      await updateDoc(doc(db, "ladders", ladderId), updatedData);
      console.log("✅ Ladder updated successfully");
      alert("Ladder updated!");
      window.location.href = "ladders.html";
    } catch (err) {
      console.error("🔥 Failed to update ladder:", err);
      alert("Failed to update ladder. Try again.");
    }
  });
}