// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Firebase config (নিজের প্রজেক্টের তথ্য বসাও)
const firebaseConfig = {
  apiKey: "AIzaSyAhCL2sI9hyVNeW47qvGSYkytmw5s3xczM",
  authDomain: "medicineapp-585cf.firebaseapp.com",
  projectId: "medicineapp-585cf",
  storageBucket: "medicineapp-585cf.appspot.com",
  messagingSenderId: "369059621588",
  appId: "1:369059621588:web:667637f5ff69f6f48a6941"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM elements
const medicineList = document.getElementById("medicineList");
const addMedicineForm = document.getElementById("addMedicineForm");
const searchBox = document.getElementById("searchBox");

const medicinesRef = collection(db, "medicines");

// Add medicine
addMedicineForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const ingredients = document.getElementById("ingredients").value.trim();
  const uses = document.getElementById("uses").value.trim();
  const dosage = document.getElementById("dosage").value.trim();
  const imageInput = document.getElementById("image");

  if (!imageInput.files || !imageInput.files[0]) {
    alert("অনুগ্রহ করে ছবি সিলেক্ট করুন");
    return;
  }

  const file = imageInput.files[0];
  const imageRef = ref(storage, `medicine_images/${Date.now()}_${file.name}`);

  try {
    // Upload image
    const snapshot = await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(snapshot.ref);

    // Add data to Firestore
    await addDoc(medicinesRef, {
      name,
      ingredients,
      uses,
      dosage,
      imageUrl,
      createdAt: serverTimestamp()
    });

    addMedicineForm.reset();
    loadMedicines(searchBox.value);
  } catch (error) {
    alert("ত্রুটি: " + error.message);
  }
});

// Load medicines
async function loadMedicines(filter = "") {
  medicineList.innerHTML = "";

  const q = query(medicinesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  let count = 0;
  snapshot.forEach((docSnap) => {
    const med = docSnap.data();
    if (med.name.toLowerCase().includes(filter.toLowerCase())) {
      count++;
      const div = document.createElement("div");
      div.className = "medicine";
      div.innerHTML = `
        <strong>${count}.</strong>
        <h3>${med.name}</h3>
        <button class="delete-btn" data-id="${docSnap.id}">ডিলিট</button>
        <p><strong>উপাদান:</strong> ${med.ingredients}</p>
        <p><strong>কাজ:</strong> ${med.uses}</p>
        <p><strong>খাওয়ার নিয়ম:</strong> ${med.dosage}</p>
        ${med.imageUrl ? `<img src="${med.imageUrl}" alt="${med.name} ছবি" />` : ""}
      `;
      medicineList.appendChild(div);
    }
  });

  if (count === 0) {
    medicineList.innerHTML = "<p>কোন ওষুধ পাওয়া যায়নি।</p>";
  }
}

// Delete medicine (event delegation)
medicineList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.getAttribute("data-id");
    if (confirm("আপনি কি মুছে ফেলতে চান?")) {
      try {
        await deleteDoc(doc(db, "medicines", id));
        loadMedicines(searchBox.value);
      } catch (error) {
        alert("ডিলিট করতে সমস্যা: " + error.message);
      }
    }
  }
});

// Search medicines on input
searchBox.addEventListener("input", (e) => {
  loadMedicines(e.target.value);
});

// Initial load
loadMedicines();
