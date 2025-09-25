import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, updatePassword, applyActionCode } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { FacebookAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCoIdMx9Zd7kQt9MSZmowbphaQVRl8D16E",
    authDomain: "admissionformdb.firebaseapp.com",
    projectId: "admissionformdb",
    storageBucket: "admissionformdb.firebasestorage.app",
    messagingSenderId: "398052082157",
    appId: "1:398052082157:web:0bc02d66cbdf55dd2567e4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utility to display error messages
function displayError(message) {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
}

// Utility to display success messages
function displaySuccess(message) {
    const successMessageElement = document.getElementById('success-message');
    if (successMessageElement) {
        successMessageElement.textContent = message;
    }
}

// Handle verification link (for login after email verification)
window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode === 'verifyEmail') {
        try {
            await applyActionCode(auth, oobCode);
            displaySuccess('ইমেইল সফলভাবে যাচাই হয়েছে। এখন লগইন করুন।');
        } catch (error) {
            displayError('ইমেইল যাচাই করতে সমস্যা হয়েছে: ' + error.message);
        }
    } else if (mode === 'resetPassword') {
        window.location.href = 'update-password.html';
    }
});

// Sign Up Functionality
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const signupButton = document.querySelector('#signupForm button[type="submit"]');
    signupButton.disabled = true;
    signupButton.textContent = 'প্রক্রিয়াকরণ হচ্ছে...';

    const displayName = document.getElementById('displayName').value;
    const emailOrPhone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        displayError('পাসওয়ার্ড মিলছে না। দয়া করে পুনরায় চেষ্টা করুন।');
        signupButton.disabled = false;
        signupButton.textContent = 'সাইন আপ';
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailOrPhone, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName });

        await sendEmailVerification(user);
        displaySuccess('আপনার মেইলে নোটিফিকেশন পাঠানো হয়েছে, ইমেইল কনফার্ম করুন।');

        signupButton.disabled = false;
        signupButton.textContent = 'সাইন আপ';
        document.getElementById('signupForm').reset();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            displayError('এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন।');
        } else {
            displayError('সাইন আপ করতে সমস্যা হয়েছে: ' + error.message);
        }
        signupButton.disabled = false;
        signupButton.textContent = 'সাইন আপ';
    }
});

// Login Functionality
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrPhone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, emailOrPhone, password);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Password Reset Functionality - Send Verification Link
document.getElementById('sendCodeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrPhone = document.getElementById('emailOrPhone').value;

    try {
        if (emailOrPhone.includes('@')) {
            await sendPasswordResetEmail(auth, emailOrPhone);
            displaySuccess('আপনার মেইলে ইমেইল পাঠানো হয়েছে, সেখানে ভেরিফাই করুন।');
            document.getElementById('sendCodeForm').reset();
        } else {
            displayError('ফোন নম্বরের জন্য এই ফিচারটি সমর্থিত নয়।');
        }
    } catch (error) {
        displayError(error.message);
    }
});

// Update Password Functionality
document.getElementById('updatePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        displayError('পাসওয়ার্ড মিলছে না।');
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('ইউজার লগইন করা নেই। দয়া করে লগইন করুন।');
        }
        await updatePassword(user, newPassword);
        displaySuccess('পাসওয়ার্ড সফলভাবে আপডেট হয়েছে।');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        displayError(error.message);
    }
});

// Google Sign-In
document.getElementById('googleSignUp')?.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName,
            email: user.email,
            createdAt: serverTimestamp()
        }, { merge: true });
        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

document.getElementById('googleSignIn')?.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Facebook Sign-In
document.getElementById('facebookSignUp')?.addEventListener('click', async () => {
    const provider = new FacebookAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName,
            email: user.email,
            createdAt: serverTimestamp()
        }, { merge: true });
        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

document.getElementById('facebookSignIn')?.addEventListener('click', async () => {
    const provider = new FacebookAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Export auth and db for use in other files
export { auth, db };