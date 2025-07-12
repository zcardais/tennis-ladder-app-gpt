import { db } from "../firebase-setup.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

console.log("✅ Edit Ladder JS loaded");

// Toast helper for non-blocking banners
function showToast(message, duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  container.classList.remove("hidden");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  // trigger CSS fade-in
  requestAnimationFrame(() => toast.classList.add("show"));
  // fade out and remove
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      container.removeChild(toast);
      if (!container.children.length) container.classList.add("hidden");
      }, 300);
  }, duration);
}

// Grab these before init
const saveButton = document.getElementById("save-button");
const spinner = document.getElementById("saving-spinner");

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const ladderId = urlParams.get("id") || urlParams.get("Id");
  if (!ladderId) {
    console.error("❌ No ladder ID in URL");
    showToast("Missing ladder ID");
    return;
  }
  console.log("🔍 Editing ladder with ID:", ladderId);

  // Grab form & inputs
  const form = document.getElementById("edit-ladder-form");
  if (!form) return console.error("⚠️ #edit-ladder-form not found");
  const nameInput = document.getElementById("ladder-name");
  const descInput = document.getElementById("description");
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const adminNamesInput = document.getElementById("admin-names");
  const adminEmailsInput = document.getElementById("admin-emails");
  const allowJoinInput = document.getElementById("allow-joining");
  const sportInput = document.getElementById("sport");
  const typeInput = document.getElementById("ladder-type");

  try {
    const ref = doc(db, "ladders", ladderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.error("❌ Ladder not found");
      showToast("Ladder not found");
      return;
    }
    const data = snap.data();
    nameInput.value = data.name || "";
    descInput.value = data.description || "";
    startInput.value = data.startDate || "";
    endInput.value = data.endDate || "";
    adminNamesInput.value = data.adminNames || "";
    adminEmailsInput.value = data.adminEmails || "";
    allowJoinInput.checked = !!data.allowJoining;
    sportInput.value = (data.sport || "tennis").toLowerCase();
    typeInput.value = (data.type || "singles").toLowerCase();
  } catch (error) {
    console.error("🔥 Error loading ladder:", error);
    showToast("Error loading ladder");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveButton.disabled = true;
    spinner.classList.remove("hidden");

    const updatedData = {
      name: nameInput.value.trim(),
      description: descInput.value.trim(),
      startDate: startInput.value,
      endDate: endInput.value,
      adminNames: adminNamesInput.value.trim(),
      adminEmails: adminEmailsInput.value.trim(),
      allowJoining: allowJoinInput.checked,
      sport: sportInput.value,
      type: typeInput.value,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(doc(db, "ladders", ladderId), updatedData);
      console.log("✅ Ladder updated");
      showToast("Ladder updated successfully!");
      setTimeout(() => window.location.href = "ladders.html", 1500);
    } catch (error) {
      console.error("🔥 Update failed:", error);
      showToast("Failed to update ladder. Try again.");
    } finally {
      saveButton.disabled = false;
      spinner.classList.add("hidden");
    }
  });
}

init();