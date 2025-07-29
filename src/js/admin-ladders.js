// File: src/js/admin-manage-players.js
export function renderPlayerList(players) {
  const tbody = document.getElementById("players-tbody");
  tbody.innerHTML = "";
  players.forEach((player, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-2 text-center">${idx + 1}</td>
      <td class="p-2 text-sm">
        ${player.firstName || ""} <span class="font-bold">${player.lastName || ""}</span>
      </td>
      <td class="p-2">${player.record || "-"}</td>
      <td class="p-2 space-x-2">
        <button class="btn-change-rank text-blue-600 hover:underline" data-user-id="${player.id}">
          Change Rank
        </button>
        <button class="btn-remove text-red-500 hover:underline" data-user-id="${player.id}">
          Remove
        </button>
        ${player.inviteId ? `
        <button class="btn-resend text-yellow-600 hover:underline" data-user-id="${player.id}">
          Resend Invite
        </button>` : ""}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase-setup.js";

export async function init() {
  console.log("admin-ladders.js initialized");

  const container = document.getElementById("admin-ladders-list");
  if (!container) return;

  container.innerHTML = "<p class='text-gray-500 text-sm'>Loading ladders...</p>";

  try {
    const snapshot = await getDocs(collection(db, "ladders"));
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p class='text-gray-500 text-sm'>No ladders found.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const ladder = doc.data();
      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded shadow mb-4";
      card.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${ladder.name || "Unnamed Ladder"}</h3>
        <p class="text-sm text-gray-600 mb-2">${ladder.description || "No description provided."}</p>
        <a href="/admin/edit-ladder.html?ladderId=${doc.id}" class="text-blue-600 hover:underline text-sm">Manage Ladder</a>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load ladders:", err);
    container.innerHTML = "<p class='text-red-600'>Failed to load ladders.</p>";
  }
}
