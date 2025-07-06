import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-setup.js";

console.log("Report.js loaded");

const urlParams = new URLSearchParams(window.location.search);
const challengeId = urlParams.get("challengeId");

const matchSummary = document.getElementById("match-summary");
const reportForm = document.getElementById("report-form");
const confirmation = document.getElementById("confirmation");

async function loadMatchDetails() {
  if (!challengeId) {
    console.error("Invalid or missing challengeId in URL");
    matchSummary.innerHTML = `<p class="text-red-500">Invalid challenge ID</p>`;
    reportForm.classList.add("hidden");
    return;
  }

  try {
    const challengeRef = doc(db, "challenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) {
      console.error(`Challenge document NOT found for ID: ${challengeId}`);
      matchSummary.innerHTML = `<p class="text-red-500">No such challenge found</p>`;
      reportForm.classList.add("hidden");
      return;
    }

    const data = challengeSnap.data();
    console.log("Fetched challenge data:", data);

    matchSummary.innerHTML = `
      <p class="text-lg font-bold">${data.challenger} vs. ${data.opponent}</p>
      <p class="text-gray-600">Date Issued: ${data.dateIssued}</p>
    `;
  } catch (error) {
    console.error("Error loading match details:", error);
    matchSummary.innerHTML = `<p class="text-red-500">Failed to load match details</p>`;
    reportForm.classList.add("hidden");
  }
}

reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const sets = [
    [
      parseInt(document.getElementById("set1-you").value || 0),
      parseInt(document.getElementById("set1-them").value || 0),
    ],
    [
      parseInt(document.getElementById("set2-you").value || 0),
      parseInt(document.getElementById("set2-them").value || 0),
    ],
    [
      parseInt(document.getElementById("set3-you").value || 0),
      parseInt(document.getElementById("set3-them").value || 0),
    ],
  ];

  console.log("Submitting sets:", sets);

  try {
    const challengeRef = doc(db, "challenges", challengeId);
    const payload = {
      status: "completed",
      score: sets, // Store as array of arrays
      updatedAt: serverTimestamp(),
    };
    console.log("Updating document:", challengeRef.path);
    console.log("Payload:", payload);

    await updateDoc(challengeRef, payload);

    console.log(`Score saved for challenge ${challengeId}`);
    confirmation.classList.remove("hidden");
    reportForm.classList.add("hidden");

    setTimeout(() => {
      window.location.href = "challenges.html";
    }, 2000);
  } catch (error) {
    console.error("🔥 Firestore updateDoc() failed:", error);
    alert("Failed to save score. Try again.");
  }
});

loadMatchDetails();