import {
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase-setup.js";

document.addEventListener("DOMContentLoaded", () => {
  
  const participantsList = document.getElementById("participants-list");
  const addForm = document.getElementById("add-player-form");
  const addInput = document.getElementById("add-player-input");
  
  const firstNameInput = document.getElementById("add-player-firstname");
  const lastNameInput = document.getElementById("add-player-lastname");
  const nameRegex = /^[A-Za-z\s\-]+$/;
  
  // Status message helpers
  function clearStatus() {
    if (!statusMessage) return;
    statusMessage.textContent = "";
    statusMessage.classList.add("hidden");
    statusMessage.classList.remove("bg-red-700", "text-red-200", "bg-green-700", "text-green-200");
  }
  function showError(message) {
    if (!statusMessage) return;
    statusMessage.textContent = `⚠️ ${message}`;
    statusMessage.classList.remove("hidden", "bg-green-700", "text-green-200");
    statusMessage.classList.add("bg-red-700", "text-red-200");
  }
  function showSuccess(message) {
    if (!statusMessage) return;
    statusMessage.textContent = `✅ ${message}`;
    statusMessage.classList.remove("hidden", "bg-red-700", "text-red-200");
    statusMessage.classList.add("bg-green-700", "text-green-200");
  }
  
  const statusMessage = document.getElementById("status-message");
  if (!statusMessage) {
    console.warn("⚠️ statusMessage element not found in DOM.");
  }
  statusMessage?.classList.add("hidden");
  
  // ─── Search & Filter Setup ──────────────────────────────────────────────────
  const searchInput   = document.getElementById("playerSearch");
  const statusButtons = document.querySelectorAll("[data-status]");
  let allFetchedPlayers = [];
  let activeStatus     = "all";
  let searchTerm       = "";
  
  function renderFiltered() {
    const filtered = allFetchedPlayers
    .filter(p => activeStatus === "all" || p.status === activeStatus)
    .filter(p => {
      const haystack = `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
    renderPlayerList(filtered);
  }
  
  // Wire up search box
  searchInput?.addEventListener("input", e => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderFiltered();
  });
  
  // Wire up status tabs
  statusButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeStatus = btn.dataset.status;
      statusButtons.forEach(b => b.classList.remove("bg-indigo-50","text-indigo-700"));
      btn.classList.add("bg-indigo-50","text-indigo-700");
      renderFiltered();
    });
  });
  // ─── Bulk Actions Setup ─────────────────────────────────────────────────────
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const exportBtn         = document.getElementById("exportBtn");
  const removeBtn         = document.getElementById("removeBtn");

  // Toggle all checkboxes
  selectAllCheckbox?.addEventListener("change", e => {
    document.querySelectorAll(".card-checkbox")
      .forEach(cb => cb.checked = e.target.checked);
  });


  // Bulk Export
  exportBtn?.addEventListener("click", () => {
    const selectedIds = Array.from(document.querySelectorAll(".card-checkbox:checked"))
      .map(cb => cb.dataset.userId);
    console.log("Export data for:", selectedIds);
    // TODO: trigger export logic (CSV, PDF, etc.)
  });

  // Bulk Remove
  removeBtn?.addEventListener("click", () => {
    const selectedIds = Array.from(document.querySelectorAll(".card-checkbox:checked"))
      .map(cb => cb.dataset.userId);
    console.log("Remove players:", selectedIds);
    // TODO: show confirmation and remove selected participants
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // Status badge helper
  function getStatusBadge(status) {
    let classes = "px-3 py-1 rounded-full text-sm font-medium w-20 text-center ";
    let label = "";
    if (status === "active") {
      classes += "bg-green-50 text-green-700";
      label = "Active";
    } else if (status === "pending") {
      classes += "bg-yellow-50 text-yellow-700";
      label = "Pending";
    } else {
      classes += "bg-gray-50 text-gray-700";
      label = "Inactive";
    }
    return `<span class="${classes}">${label}</span>`;
  }

  // ─── Initial load of all players ─────────────────────────────────────────────
  async function loadAllPlayers() {
    const playersSnap = await getDocs(collection(db, "players"));
    allFetchedPlayers = playersSnap.docs.map(d => {
      const data = d.data();
      let status = "inactive";
      if (data.inviteId && !data.ladderId) status = "pending";
      else if (data.ladderId) status = "active";
      return { id: d.id, status, ...data };
    });
    renderFiltered();
  }
  loadAllPlayers();
  // ─────────────────────────────────────────────────────────────────────────────
  
  function renderPlayerList(players) {
    // Clear existing rows
    participantsList.innerHTML = "";
    
    players.forEach((player, idx) => {
      const li = document.createElement("li");
      li.className = "bg-white rounded-xl p-4 flex items-center justify-between shadow";
      li.innerHTML = `
    <div class="flex items-center space-x-4">
      <input type="checkbox" class="card-checkbox h-5 w-5 text-indigo-600" data-user-id="${player.id}" />
      <span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 text-white font-bold">
        ${player.firstName.charAt(0).toUpperCase()}${player.lastName.charAt(0).toUpperCase()}
      </span>
      <div class="flex flex-col">
        <span class="font-medium text-gray-900">${player.lastName}, ${player.firstName}</span>
        ${getStatusBadge(player.status)}
        <span class="text-sm text-gray-600">${player.record || '-'}</span>
      </div>
    </div>
    <button class="btn-edit text-indigo-600 hover:underline" data-user-id="${player.id}">
      Edit
    </button>
  `;
      participantsList.appendChild(li);
    });
  }
  
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();
    
    const email = addInput.value.trim().toLowerCase();
    const firstName = document.getElementById("add-player-firstname")?.value.trim() || "";
    const lastName = document.getElementById("add-player-lastname")?.value.trim() || "";
    
    if (!addInput.checkValidity()) {
      showError(addInput.title || "Please enter a valid email address.");
      return;
    }
    if (!firstName && !lastName) {
      showError("Please enter at least a first or last name.");
      return;
    }
    if (firstName && !firstNameInput.checkValidity()) {
      showError(firstNameInput.title);
      return;
    }
    if (lastName && !lastNameInput.checkValidity()) {
      showError(lastNameInput.title);
      return;
    }
    if (firstName && !nameRegex.test(firstName)) {
      showError("First name can only contain letters, spaces, and hyphens.");
      return;
    }
    if (lastName && !nameRegex.test(lastName)) {
      showError("Last name can only contain letters, spaces, and hyphens.");
      return;
    }
    
    const addButton = addForm.querySelector("button[type='submit']");
    addButton.disabled = true;
    addButton.textContent = "Adding...";
    
    try {
      // Look for existing player by email
      const playersRef = collection(db, "players");
      const q = query(playersRef, where("email", "==", email));
      const snap = await getDocs(q);
      
      let userId;
      
      if (snap.empty) {
        // Create new player doc with email, firstName, lastName
        const newPlayerRef = doc(playersRef);
        await setDoc(newPlayerRef, {
          email,
          firstName,
          lastName,
          rank: 0
        });
        userId = newPlayerRef.id;
      } else {
        userId = snap.docs[0].id;
      }
      
      showSuccess("Player added successfully.");
      console.log("Added/updated userId:", userId);
      
      addInput.value = "";
      document.getElementById("add-player-firstname").value = "";
      document.getElementById("add-player-lastname").value = "";
      loadAllPlayers();
    } finally {
      addButton.disabled = false;
      addButton.textContent = "Add Player";
      setTimeout(() => {
        clearStatus();
      }, 3000);
    }
  });
  
  // Navigate to Add Member page
  const openAddBtn = document.getElementById("openAddMember");
  openAddBtn?.addEventListener("click", () => {
    window.location.href = "add-member.html";
  });
});