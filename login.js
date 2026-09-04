// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase.app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase.auth.js";
import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firestore.js";

// Your web app's Firebase configuration (Replace with your actual keys from Firebase Console)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 1. SIGN UP ---
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "user"
        });

        alert("Account created successfully!");

        // ADD IT HERE (Optional: redirects right after signup)
        window.location.href = "index.html";

    } catch (error) {
        alert("Error signing up: " + error.message);
    }
});

// --- 2. LOG IN ---
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");

        // ADD IT HERE (This is the most important one!)
        window.location.href = "index.html";

    } catch (error) {
        alert("Error logging in: " + error.message);
    }
});

// --- 3. LOG OUT ---
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert("Logged out!");
    } catch (error) {
        console.error("Error logging out", error);
    }
});

// --- 4. AUTH STATE MONITOR (Tracks if user is logged in or out) ---
onAuthStateChanged(auth, (user) => {
    const signupSection = document.getElementById('signup-section');
    const loginSection = document.getElementById('login-section');
    const logoutSection = document.getElementById('logout-section');
    const userDisplay = document.getElementById('user-display');

    if (user) {
        // User is signed in
        signupSection.style.display = 'none';
        loginSection.style.display = 'none';
        logoutSection.style.display = 'block';
        userDisplay.innerText = `Logged in as: ${user.email}`;
    } else {
        // User is signed out
        signupSection.style.display = 'block';
        loginSection.style.display = 'block';
        logoutSection.style.display = 'none';
    }
});