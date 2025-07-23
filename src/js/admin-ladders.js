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

// File: public/admin/players.html
<thead>
  <tr>
    <th class="p-2 text-left">Rank</th>
    <th class="p-2 text-left">Player</th>
    <th class="p-2 text-left">Record</th>
  </tr>
</thead>