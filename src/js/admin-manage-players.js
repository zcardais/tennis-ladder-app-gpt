import {
  getDoc,
  doc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase-setup.js";

document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const ladderId = urlParams.get("ladderId");
  const participantsList = document.getElementById("participants-list");
  const addForm = document.getElementById("add-player-form");
  const addInput = document.getElementById("add-player-input");
  const statusMessage = document.getElementById("status-message");
  const ladderNameDisplay = document.getElementById("ladder-name");

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

  if (!statusMessage) {
    console.warn("⚠️ statusMessage element not found in DOM.");
  }
  statusMessage?.classList.add("hidden");

  let ladderRef;
  let currentParticipants = [];

  async function fetchLadderAndPlayers() {
    if (!ladderId) {
      console.error("No ladderId found in URL");
      return;
    }

    ladderRef = doc(db, "ladders", ladderId);
    const ladderSnap = await getDoc(ladderRef);

    if (!ladderSnap.exists()) {
      console.error("Ladder not found");
      return;
    }

    const ladderData = ladderSnap.data();

    if (ladderNameDisplay) {
      ladderNameDisplay.textContent = ladderData.name || "Unnamed Ladder";
    }

    currentParticipants = ladderData.participants || [];

    if (currentParticipants.length === 0) {
      participantsList.innerHTML = "<p class='text-gray-500'>No players found in this ladder.</p>";
      if (statusMessage) {
        statusMessage.textContent = "This ladder currently has no players.";
      }
      return;
    }

    // Firestore 'in' queries are limited to 10 elements — batch them
    const playersRef = collection(db, "players");
    const chunks = [];
    for (let i = 0; i < currentParticipants.length; i += 10) {
      chunks.push(currentParticipants.slice(i, i + 10));
    }

    const allPlayers = [];
    for (const chunk of chunks) {
      const q = query(playersRef, where("__name__", "in", chunk));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const player = { id: doc.id, ...doc.data() };
        if (player.ladderId !== ladderId) {
          console.warn(`⚠️ Player ${player.email} belongs to ${player.ladderId}, not ${ladderId}`);
        }
        allPlayers.push(player);
      });
    }

    if (allPlayers.length === 0) {
      participantsList.innerHTML = "<p class='text-gray-500'>No matching players found for this ladder.</p>";
    } else {
      renderPlayerList(allPlayers);
    }
  }

  function renderPlayerList(players) {
    participantsList.innerHTML = "";
    players.forEach((player) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center border-b py-2";

      const fullName = `${player.firstName || ""} ${player.lastName || ""}`.trim();
      const displayName = fullName || player.email || "(no name)";

      // Create elements for display mode
      const nameSpan = document.createElement("span");
      nameSpan.textContent = displayName;

      const removeButton = document.createElement("button");
      removeButton.className = "text-red-500 hover:underline ml-2";
      removeButton.textContent = "Remove";

      const editButton = document.createElement("button");
      editButton.className = "text-blue-500 hover:underline ml-2";
      editButton.textContent = "Edit";

      // Container for buttons
      const buttonContainer = document.createElement("div");
      buttonContainer.appendChild(editButton);
      buttonContainer.appendChild(removeButton);

      if (player.inviteId) {
        const resendButton = document.createElement("button");
        resendButton.className = "text-yellow-600 hover:underline ml-2";
        resendButton.textContent = "Resend Invite";
        resendButton.addEventListener("click", async () => {
          try {
            await fetch("/resendLadderInvite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: player.email, inviteId: player.inviteId }),
            });
            alert(`Invite resent to ${player.email}`);
          } catch (err) {
            console.error(err);
            alert("Failed to resend invite.");
          }
        });
        buttonContainer.appendChild(resendButton);
      }

      li.appendChild(nameSpan);
      li.appendChild(buttonContainer);

      // Remove button event
      removeButton.addEventListener("click", async () => {
        if (confirm(`Remove ${displayName} from this ladder?`)) {
          await updateDoc(ladderRef, {
            participants: arrayRemove(player.id),
          });
          fetchLadderAndPlayers();
        }
      });

      // Edit button event
      editButton.addEventListener("click", () => {
        // Replace nameSpan with input fields
        const firstNameInput = document.createElement("input");
        firstNameInput.type = "text";
        firstNameInput.value = player.firstName || "";
        firstNameInput.placeholder = "First Name";
        firstNameInput.className = "border p-1 mr-1";

        const lastNameInput = document.createElement("input");
        lastNameInput.type = "text";
        lastNameInput.value = player.lastName || "";
        lastNameInput.placeholder = "Last Name";
        lastNameInput.className = "border p-1 mr-1";

        const emailInput = document.createElement("input");
        emailInput.type = "email";
        emailInput.value = player.email || "";
        emailInput.placeholder = "Email";
        emailInput.className = "border p-1";

        // Replace buttons with Save and Cancel
        const saveButton = document.createElement("button");
        saveButton.className = "text-green-600 hover:underline ml-2";
        saveButton.textContent = "Save";

        const cancelButton = document.createElement("button");
        cancelButton.className = "text-gray-600 hover:underline ml-2";
        cancelButton.textContent = "Cancel";

        // Clear li and add input fields and new buttons
        li.innerHTML = "";

        const inputsContainer = document.createElement("div");
        inputsContainer.className = "flex flex-wrap gap-2 items-center";
        inputsContainer.appendChild(firstNameInput);
        inputsContainer.appendChild(lastNameInput);
        inputsContainer.appendChild(emailInput);
        li.appendChild(inputsContainer);

        const editButtonContainer = document.createElement("div");
        editButtonContainer.className = "flex gap-2 mt-2";
        editButtonContainer.appendChild(saveButton);
        editButtonContainer.appendChild(cancelButton);
        li.appendChild(editButtonContainer);

        // Save button event
        saveButton.addEventListener("click", async () => {
          const newFirstName = firstNameInput.value.trim();
          const newLastName = lastNameInput.value.trim();
          const newEmail = emailInput.value.trim();

          await updateDoc(doc(db, "players", player.id), {
            firstName: newFirstName,
            lastName: newLastName,
            email: newEmail,
          });

          fetchLadderAndPlayers();
        });

        // Cancel button event
        cancelButton.addEventListener("click", () => {
          renderPlayerList(players);
        });
      });

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

      if (currentParticipants.includes(userId)) {
        showError("That player is already in the ladder.");
        return;
      }

      await updateDoc(ladderRef, {
        participants: arrayUnion(userId),
      });

      showSuccess("Player added successfully.");
      console.log("Added userId to participants:", userId);

      addInput.value = "";
      document.getElementById("add-player-firstname").value = "";
      document.getElementById("add-player-lastname").value = "";
      fetchLadderAndPlayers();
    } finally {
      addButton.disabled = false;
      addButton.textContent = "Add Player";
      setTimeout(() => {
        clearStatus();
      }, 3000);
    }
  });

  fetchLadderAndPlayers();
});