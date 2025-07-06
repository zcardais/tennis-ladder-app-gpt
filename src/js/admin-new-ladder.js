import { db } from "./firebase-setup.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function init() {
  console.log("✅ Admin New Ladder JS loaded");

  const form = document.getElementById("new-ladder-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("ladder-name").value.trim();
    const description = document.getElementById("description").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const rankingSystem = document.getElementById("ranking-system").value;

    const newLadder = {
      name,
      description,
      startDate,
      endDate,
      rankingSystem,
      status: "active",
      participants: [],
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "ladders"), newLadder);
      console.log("✅ Ladder created with ID:", docRef.id);
      window.location.href = "ladders.html";
    } catch (error) {
      console.error("🔥 Failed to create ladder:", error);
      alert("Failed to create ladder. Try again.");
    }
  });
}