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
    let playerDoc;
    if (snap.empty) {
      // Fallback to document ID lookup if no doc matches uid field
      const docRef = doc(db, "players", uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      playerDoc = docSnap;
    } else {
      playerDoc = snap.docs[0];
    }
    const playerData = playerDoc.data();
    const playerId = playerDoc.id;

    // Populate profile fields
    const profileName = document.getElementById("profile-name");
    const profileMemberSince = document.getElementById("profile-member-since");
    const profileLadders = document.getElementById("profile-ladders");
    const profileMatches = document.getElementById("profile-matches");
    const profileWins = document.getElementById("profile-wins");
    const playerInitials = document.getElementById("player-initials");

    if (profileName) {
      profileName.textContent = `${playerData.firstName || ""} ${playerData.lastName || ""}`.trim();
    }
    if (profileMemberSince) {
      profileMemberSince.textContent = playerData.memberSince || "";
    }
    if (profileLadders) {
      profileLadders.textContent = (playerData.ladders && playerData.ladders.length) || 0;
    }
    // Query matches collection for matches and wins
    if (profileMatches || profileWins) {
      const matchesQuery = query(
        collection(db, "matches"),
        where("players", "array-contains", playerData.uid)
      );
      const matchesSnap = await getDocs(matchesQuery);
      let totalMatches = 0;
      let winCount = 0;
      matchesSnap.forEach(doc => {
        const match = doc.data();
        totalMatches++;
        if (match.winner === playerData.uid) winCount++;
      });
      if (profileMatches) profileMatches.textContent = totalMatches;
      if (profileWins) profileWins.textContent = winCount;
    }
    if (playerInitials) {
      const firstInitial = playerData.firstName ? playerData.firstName.charAt(0).toUpperCase() : "";
      const lastInitial = playerData.lastName ? playerData.lastName.charAt(0).toUpperCase() : "";
      playerInitials.textContent = firstInitial + lastInitial;
    }

    // Populate the profile edit form inputs
    const editFirstName = document.getElementById("edit-first-name");
    const editLastName = document.getElementById("edit-last-name");
    const editEmail = document.getElementById("edit-email");
    const editPhone = document.getElementById("edit-phone");
    if (editFirstName) editFirstName.value = playerData.firstName || "";
    if (editLastName) editLastName.value = playerData.lastName || "";
    if (editEmail) editEmail.value = playerData.email || "";
    if (editPhone) editPhone.value = playerData.phoneNumber || "";

    // Add submit event listener to the profile edit form
    const profileEditForm = document.getElementById("profile-edit-form");
    if (profileEditForm) {
      profileEditForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const updatedFirstName = editFirstName ? editFirstName.value.trim() : "";
        const updatedLastName = editLastName ? editLastName.value.trim() : "";
        const updatedEmail = editEmail ? editEmail.value.trim() : "";
        const updatedPhone = editPhone ? editPhone.value.trim() : "";
        console.log("Saving profile with values:", {
          firstName: updatedFirstName,
          lastName: updatedLastName,
          email: updatedEmail,
          phoneNumber: updatedPhone
        });
        try {
          await updateDoc(doc(db, "players", playerId), {
            firstName: updatedFirstName,
            lastName: updatedLastName,
            email: updatedEmail,
            phoneNumber: updatedPhone
          });
          // Optionally update the name and initials shown at the top of the profile
          if (profileName) {
            profileName.textContent = `${updatedFirstName} ${updatedLastName}`.trim();
          }
          if (playerInitials) {
            const firstInitial = updatedFirstName ? updatedFirstName.charAt(0).toUpperCase() : "";
            const lastInitial = updatedLastName ? updatedLastName.charAt(0).toUpperCase() : "";
            playerInitials.textContent = firstInitial + lastInitial;
          }
          // Show a temporary visual confirmation
          const saveStatus = document.getElementById("save-status");
          if (saveStatus) {
            saveStatus.classList.remove("hidden");
            setTimeout(() => saveStatus.classList.add("hidden"), 3000);
          }
        } catch (err) {
          console.error("Error updating profile:", err);
          alert("Error saving profile. Please check your internet connection or permissions.");
          // Optionally show an error message
        }
      });
    }

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