import { db } from './firebase-setup.js';
import { collection, getDocs } from "firebase/firestore";

export async function testFirestoreRead() {
  try {
	const querySnapshot = await getDocs(collection(db, "ladders"));
	console.log("Ladders Collection:");
	querySnapshot.forEach((doc) => {
	  console.log(doc.id, "=>", doc.data());
	});
  } catch (e) {
	console.error("Error reading Firestore:", e);
  }
}