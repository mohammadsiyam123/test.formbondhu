/**
 * Combined chat functionality for handling Firebase, chat history, and UI interactions.
 * Updated to handle two separate chat boxes: left (আবেদন) and right (প্রশ্ন জিজ্ঞাসা).
 * Right chat's welcome message hides immediately after the user sends a message.
 * Added new "জনরা 2" modal triggered by the "আরও" button (moreOptionsBtn-right) in the right chat box.
 * Left chat's "আরও" button (moreOptionsBtn) opens the existing genresModal.
 * Messages are isolated: left messages only in left, right in right.
 * Right chat displays messages in a clean, beautiful way under "প্রশ্ন জিজ্ঞাসা".
 * Each chat has its own chatId and history.
 * Updated genres2 to have categories like NID, Passport, Company Registration with toggle sub-questions.
 * No message sent on category click; toggle shows/hides sub-questions.
 * Sub-questions send message on click.
 */
 
document.getElementById('videoIcon').addEventListener('click', function() {
       document.getElementById('videoModal').style.display = 'flex';
       // Reset video to start when modal opens
       const video = document.getElementById('tutorialVideo');
       if (video) {
           video.currentTime = 0;
           video.load();
       }
   });

   document.getElementById('closeVideoModal').addEventListener('click', function() {
       document.getElementById('videoModal').style.display = 'none';
       // Pause video when modal closes
       const video = document.getElementById('tutorialVideo');
       if (video) {
           video.pause();
       }
   });
// Firebase SDK Check
if (typeof firebase === 'undefined') throw new Error("Firebase SDK not loaded. Add Firebase CDN in index.html");

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCoIdMx9Zd7kQt9MSZmowbphaQVRl8D16E",
    authDomain: "admissionformdb.firebaseapp.com",
    projectId: "admissionformdb",
    storageBucket: "admissionformdb.appspot.com",
    messagingSenderId: "398052082157",
    appId: "1:398052082157:web:0bc02d66cbdf55dd2567e4"
};

// Initialize Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let leftChatId = localStorage.getItem('leftChatId') || null;
let rightChatId = localStorage.getItem('rightChatId') || null;
let currentUserUid = null;
let selectedFile = null;
let editedImage = null;

// DOM Elements
const elements = {
    sidebar: document.getElementById('sidebar'),
    historyList: document.getElementById('historyList'),
    historyIcon: document.getElementById('historyIcon'),
    closeSidebar: document.getElementById('closeSidebar'),
    newChatIcon: document.getElementById('newChatIcon'),
    searchInput: document.getElementById('searchInput'),
    deleteModal: document.getElementById('deleteModal'),
    renameModal: document.getElementById('renameModal'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete'),
    cancelRename: document.getElementById('cancelRename'),
    saveRename: document.getElementById('saveRename'),
    renameInput: document.getElementById('renameInput'),
    messagesDiv: document.getElementById('messages'), // Left chat messages
    messagesRight: document.getElementById('messages-right'), // Right chat messages
    welcomeMessage: document.getElementById('welcomeMessage'), // Left welcome
    welcomeMessageRight: document.getElementById('welcomeMessage-right'), // Right welcome
    userInput: document.getElementById('userInput'), // Left input
    userInputRight: document.getElementById('userInput-right'), // Right input
    sendBtn: document.getElementById('sendBtn'), // Left send
    sendBtnRight: document.getElementById('sendBtn-right'), // Right send
    uploadBtn: document.getElementById('uploadBtn'),
    uploadBtnRight: document.getElementById('uploadBtn-right'),
    fileInput: document.getElementById('fileInput'),
    fileInputRight: document.getElementById('fileInput-right'),
    previewContainer: document.getElementById('previewContainer'),
    previewContainerRight: document.getElementById('previewContainer-right'),
    previewImage: document.getElementById('previewImage'),
    previewImageRight: document.getElementById('previewImage-right'),
    editModal: document.getElementById('editModal'),
    editCanvas: document.getElementById('editCanvas'),
    cropX: document.getElementById('cropX'),
    cropY: document.getElementById('cropY'),
    cropWidth: document.getElementById('cropWidth'),
    cropHeight: document.getElementById('cropHeight'),
    brightness: document.getElementById('brightness'),
    contrast: document.getElementById('contrast'),
    backgroundColor: document.getElementById('bgColor'),
    editCancelBtn: document.getElementById('cancelEdit'),
    editApplyBtn: document.getElementById('editApplyBtn'),
    moreOptionsBtn: document.getElementById('moreOptionsBtn'), // Left "আরও" button
    moreOptionsBtnRight: document.getElementById('moreOptionsBtn-right'), // Right "আরও" button
    genresModal: document.getElementById('genresModal'),
    closeGenresModal: document.getElementById('closeGenresModal'),
    genresList: document.getElementById('genresList'),
    genres2Modal: document.getElementById('genres2Modal'),
    closeGenres2Modal: document.getElementById('closeGenres2Modal'),
    genres2List: document.getElementById('genres2List'),
    imageReviewModal: document.getElementById('imageReviewModal'),
    reviewImage: document.getElementById('reviewImage'),
    deleteImageBtn: document.getElementById('deleteImageBtn')
};

// Image Editing State
const cropRect = { x: 0, y: 0, width: 200, height: 200 };
let brightnessValue = 0;
let contrastValue = 0;
let bgColor = 'white';
const ctx = elements.editCanvas?.getContext('2d');
const image = new Image();

// Genres Data (for left chat)
const genres = [
    { name: 'এনআইডি আবেদন', icon: 'fas fa-id-card', message: 'আমার জন্য একটি এনআইডি তৈরি করতে চাই' },
    { name: 'পাসপোর্ট আবেদন', icon: 'fas fa-passport', message: 'আমি পাসপোর্ট আবেদন করতে চাই' },
    { name: 'কোম্পানি রেজিস্ট্রেশন', icon: 'fas fa-building', message: 'আমি কোম্পানি রেজিস্ট্রেশন করতে চাই' },
];

// Genres2 Data (for right chat, with sub-questions)
const genres2 = [
    {
        name: 'এনআইডি আবেদন',
        icon: 'fas fa-id-card',
        subQuestions: [
            { question: 'এনআইডি আবেদন করতে কত বয়স হওয়া উচিত?', message: 'এনআইডি আবেদন করতে কত বয়স হওয়া উচিত?' },
            { question: 'এনআইডি করতে কি কি তথ্য থাকা দরকার?', message: 'এনআইডি করতে কি কি তথ্য থাকা দরকার?' },
            { question: 'এনআইডির জন্য কিভাবে আবেদন করতে হয়?', message: 'এনআইডির জন্য কিভাবে আবেদন করতে হয়?' },
            { question: 'এনআইডি আবেদন করতে কি বাবা মার অনুমতি নিতে হয়?', message: 'এনআইডি আবেদন করতে কি বাবা মার অনুমতি নিতে হয়?' }
        ]
    },
    {
        name: 'পাসপোর্ট আবেদন',
        icon: 'fas fa-passport',
        subQuestions: [
            { question: 'পাসপোর্ট আবেদন করতে কত বয়স হওয়া উচিত?', message: 'পাসপোর্ট আবেদন করতে কত বয়স হওয়া উচিত?' },
            { question: 'পাসপোর্ট করতে কি কি তথ্য থাকা দরকার?', message: 'পাসপোর্ট করতে কি কি তথ্য থাকা দরকার?' },
            { question: 'পাসপোর্টের জন্য কিভাবে আবেদন করতে হয়?', message: 'পাসপোর্টের জন্য কিভাবে আবেদন করতে হয়?' },
            { question: 'পাসপোর্ট আবেদন করতে কি বাবা মার অনুমতি নিতে হয়?', message: 'পাসপোর্ট আবেদন করতে কি বাবা মার অনুমতি নিতে হয়?' }
        ]
    },
    {
        name: 'কোম্পানি রেজিস্ট্রেশন',
        icon: 'fas fa-building',
        subQuestions: [
            { question: 'কোম্পানি রেজিস্ট্রেশন করতে কি কি তথ্য থাকা দরকার?', message: 'কোম্পানি রেজিস্ট্রেশন করতে কি কি তথ্য থাকা দরকার?' },
            { question: 'কোম্পানি রেজিস্ট্রেশনের জন্য কিভাবে আবেদন করতে হয়?', message: 'কোম্পানি রেজিস্ট্রেশনের জন্য কিভাবে আবেদন করতে হয়?' },
            { question: 'কোম্পানি রেজিস্ট্রেশন করতে কত সময় লাগে?', message: 'কোম্পানি রেজিস্ট্রেশন করতে কত সময় লাগে?' },
            { question: 'কোম্পানি রেজিস্ট্রেশনের খরচ কত?', message: 'কোম্পানি রেজিস্ট্রেশনের খরচ কত?' }
        ]
    }
];

// Auth State Listener
function initializeApp() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserUid = user.uid;
            if (elements.messagesDiv && elements.historyList && elements.messagesRight) {
                loadChatHistory();
                if (leftChatId) loadChatMessages(leftChatId, 'left');
                else startNewChat('left');
                if (rightChatId) loadChatMessages(rightChatId, 'right');
                else startNewChat('right');
            } else {
                showErrorMessage('DOM elements not found. Please check your HTML.', 'left');
            }
        } else {
            currentUserUid = null;
            window.location.href = 'login.html';
        }
    });
}

// Utility Functions
function sanitizeMessage(message) {
    const div = document.createElement('div');
    div.textContent = message;
    return div.innerHTML;
}

function displayMessage(message, sender, side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) {
        console.error(`${side} messages container not found`);
        return;
    }
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message', 'slide-in');
    if (typeof message === 'string' && (message.startsWith('http') || message.startsWith('data:image'))) {
        const img = document.createElement('img');
        img.src = message;
        img.classList.add('chat-image');
        img.alt = 'Uploaded Image';
        img.addEventListener('click', () => openImageModal(message));
        messageDiv.appendChild(img);
    } else {
        messageDiv.innerHTML = sanitizeMessage(message);
    }
    if (side === 'right') {
        messageDiv.style.margin = '10px 0';
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.backgroundColor = sender === 'user' ? '#e0f7fa' : '#f1f8e9';
    }
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showErrorMessage(message, side) {
    console.error(message);
    displayMessage(sanitizeMessage(message), 'bot', side);
}

function hideWelcomeMessage(side) {
    const welcome = side === 'left' ? elements.welcomeMessage : elements.welcomeMessageRight;
    if (welcome && welcome.style.display !== 'none') {
        welcome.classList.add('fade-out');
        setTimeout(() => {
            welcome.style.display = 'none';
            welcome.classList.remove('fade-out');
        }, 300);
    }
}

function showWelcomeMessage(side) {
    const welcome = side === 'left' ? elements.welcomeMessage : elements.welcomeMessageRight;
    if (welcome && welcome.style.display === 'none') {
        welcome.style.display = 'block';
    }
}

function showTypingIndicator(side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) {
        console.error(`${side} messages container not found`);
        return null;
    }
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
}

// Chat History Functions
async function startNewChat(side) {
    if (!currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।', side);
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) return showErrorMessage('Messages container not found', side);
    try {
        const chatRef = await db.collection('chats').add({
            uid: currentUserUid,
            name: `${side === 'left' ? 'নতুন আবেদন চ্যাট' : 'নতুন প্রশ্ন চ্যাট'}`,
            last_message: 'চ্যাট শুরু হয়েছে',
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
            side: side
        });
        const chatId = chatRef.id;
        if (side === 'left') {
            leftChatId = chatId;
            localStorage.setItem('leftChatId', leftChatId);
        } else {
            rightChatId = chatId;
            localStorage.setItem('rightChatId', rightChatId);
        }
        await db.collection('chats').doc(chatId).collection('messages').add({
            message: 'Chat session started',
            sender: 'system',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            uid: currentUserUid
        });
        messagesContainer.innerHTML = '';
        showWelcomeMessage(side);
        await loadChatHistory();
    } catch (error) {
        showErrorMessage('নতুন চ্যাট শুরু করতে সমস্যা: ' + error.message, side);
    }
}

async function saveChatHistory(message, sender, side) {
    if (!currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।', side);
    if (!message || typeof message !== 'string') return showErrorMessage('অবৈধ মেসেজ।', side);
    const chatId = side === 'left' ? leftChatId : rightChatId;
    if (!chatId) await startNewChat(side);
    if (!chatId) return showErrorMessage('চ্যাট তৈরি ব্যর্থ।', side);
    try {
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return showErrorMessage('চ্যাট ডকুমেন্ট পাওয়া যায়নি।', side);
        await db.collection('chats').doc(chatId).collection('messages').add({
            uid: currentUserUid,
            message,
            sender,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('chats').doc(chatId).update({
            last_message: message.substring(0, 50),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        showErrorMessage('চ্যাট হিস্ট্রি সেভ করতে সমস্যা: ' + error.message, side);
    }
}

async function loadChatMessages(chatId, side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) return;
    if (side === 'left') leftChatId = chatId;
    else rightChatId = chatId;
    localStorage.setItem(`${side}ChatId`, chatId);
    messagesContainer.innerHTML = '';
    try {
        const snapshot = await db.collection('chats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'asc').get();
        let hasNonSystemMessages = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.sender !== 'system') {
                displayMessage(data.message, data.sender, side);
                hasNonSystemMessages = true;
            }
        });
        if (hasNonSystemMessages) {
            hideWelcomeMessage(side);
        } else {
            showWelcomeMessage(side);
        }
    } catch (error) {
        showErrorMessage('মেসেজ লোডে সমস্যা: ' + error.message, side);
    }
}

async function loadChatHistory(searchTerm = '') {
    if (!currentUserUid || !elements.historyList) return;
    elements.historyList.innerHTML = '';
    try {
        let query = db.collection('chats').where('uid', '==', currentUserUid).orderBy('updated_at', 'desc');
        const snapshot = await query.get();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (searchTerm && !data.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
            const item = document.createElement('div');
            item.classList.add('history-item');
            item.innerHTML = `
                <span class="history-name">${sanitizeMessage(data.name)}</span>
                <span class="history-last">${sanitizeMessage(data.last_message.substring(0, 30)) + '...'}</span>
                <i class="fas fa-edit rename-icon" data-id="${doc.id}"></i>
                <i class="fas fa-trash delete-icon" data-id="${doc.id}"></i>
            `;
            item.addEventListener('click', () => loadChatMessages(doc.id, data.side));
            elements.historyList.appendChild(item);
        });
        document.querySelectorAll('.delete-icon').forEach(icon => {
            icon.addEventListener('click', e => {
                e.stopPropagation();
                currentChatId = e.target.getAttribute('data-id');
                elements.deleteModal.style.display = 'block';
            });
        });
        document.querySelectorAll('.rename-icon').forEach(icon => {
            icon.addEventListener('click', e => {
                e.stopPropagation();
                currentChatId = e.target.getAttribute('data-id');
                elements.renameInput.value = '';
                elements.renameModal.style.display = 'block';
            });
        });
    } catch (error) {
        console.error('হিস্ট্রি লোডে সমস্যা: ', error);
    }
}

async function deleteChat() {
    if (!currentChatId) return;
    try {
        await db.collection('chats').doc(currentChatId).delete();
        elements.deleteModal.style.display = 'none';
        await loadChatHistory();
        if (currentChatId === leftChatId) {
            leftChatId = null;
            localStorage.removeItem('leftChatId');
            startNewChat('left');
        } else if (currentChatId === rightChatId) {
            rightChatId = null;
            localStorage.removeItem('rightChatId');
            startNewChat('right');
        }
    } catch (error) {
        showErrorMessage('চ্যাট ডিলিটে সমস্যা: ' + error.message);
    }
}

async function renameChat() {
    if (!currentChatId || !elements.renameInput.value.trim()) return;
    try {
        await db.collection('chats').doc(currentChatId).update({
            name: elements.renameInput.value.trim()
        });
        elements.renameModal.style.display = 'none';
        await loadChatHistory();
    } catch (error) {
        showErrorMessage('চ্যাট রিনেমে সমস্যা: ' + error.message);
    }
}

// Sidebar Handlers
function toggleSidebar() {
    if (elements.sidebar) elements.sidebar.classList.toggle('active');
}

function closeSidebarHandler() {
    if (elements.sidebar) elements.sidebar.classList.remove('active');
}

// Send Message Function
function sendMessage(side, message) {
    const input = side === 'left' ? elements.userInput : elements.userInputRight;
    if (!message && (!input || !input.value.trim())) return;
    const msg = message || input.value.trim();
    displayMessage(msg, 'user', side);
    saveChatHistory(msg, 'user', side);
    callRasaAPI(msg, {}, side);
    if (!message && input) input.value = '';
    hideWelcomeMessage(side); // Hide welcome message for the specific box
}

// Rasa API Call
function callRasaAPI(message, metadata = {}, side) {
    const typingDiv = showTypingIndicator(side);
    if (!typingDiv) return;
    const chatId = side === 'left' ? leftChatId : rightChatId;
    const payload = { sender: chatId || 'default', message, ...metadata };
    setTimeout(() => {
        if (typeof $ === 'undefined') {
            typingDiv.remove();
            showErrorMessage('jQuery লোড হয়নি।', side);
            return;
        }
        $.ajax({
            url: 'http://localhost:5005/webhooks/rest/webhook',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: data => {
                typingDiv.remove();
                if (!data || !data.length) {
                    showErrorMessage('কোনো সাড়া পাওয়া যায়নি।', side);
                    saveChatHistory('কোনো সাড়া পাওয়া যায়নি।', 'bot', side);
                    return;
                }
                data.forEach(response => {
                    if (response.text && !response.text.toLowerCase().includes('hi')) {
                        displayMessage(sanitizeMessage(response.text), 'bot', side);
                        saveChatHistory(sanitizeMessage(response.text), 'bot', side);
                    }
                    if (response.custom?.review_data) {
                        displayReview(response.custom.review_data, side);
                    }
                    if (response.buttons) {
                        const buttonDiv = document.createElement('div');
                        buttonDiv.classList.add('welcome-buttons');
                        response.buttons.forEach(btn => {
                            const button = document.createElement('button');
                            button.textContent = sanitizeMessage(btn.title);
                            button.classList.add('ripple-btn');
                            button.addEventListener('click', () => sendMessage(side, btn.payload));
                            buttonDiv.appendChild(button);
                        });
                        const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
                        messagesContainer?.appendChild(buttonDiv);
                    }
                });
            },
            error: () => {
                typingDiv.remove();
                showErrorMessage('বট সংযোগে সমস্যা।', side);
                saveChatHistory('বট সংযোগে সমস্যা।', 'bot', side);
            }
        });
    }, 500);
}

// Display Review
function displayReview(reviewData, side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) return;
    const reviewCard = document.createElement('div');
    reviewCard.classList.add('review-card');
    reviewCard.setAttribute('data-editable', 'false');
    reviewCard.setAttribute('data-confirmed', 'false');
    const reviewContent = document.createElement('div');
    reviewContent.classList.add('review-content');
    Object.entries(reviewData).forEach(([key, value]) => {
        const item = document.createElement('div');
        item.classList.add('review-item');
        item.setAttribute('data-key', key);
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
            item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><img src="${value}" />`;
        } else {
            item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><p>${sanitizeMessage(value)}</p>`;
        }
        reviewContent.appendChild(item);
    });
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('review-buttons');
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn', 'ripple-btn');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => toggleEdit(reviewCard, editBtn, reviewContent, confirmBtn, reviewData, side));
    const confirmBtn = document.createElement('button');
    confirmBtn.classList.add('confirm-btn', 'ripple-btn');
    confirmBtn.textContent = 'Confirm';
    let isProcessing = false;
    confirmBtn.addEventListener('click', async () => {
        if (isProcessing || reviewCard.getAttribute('data-confirmed') === 'true') return;
        isProcessing = true;
        confirmBtn.disabled = true;
        try {
            if (!currentUserUid) throw new Error('ইউজার লগইন করেননি।');
            const updatedData = {};
            reviewContent.querySelectorAll('.review-item').forEach(item => {
                const key = item.getAttribute('data-key');
                const value = item.querySelector('p')?.textContent || item.querySelector('img')?.src;
                if (value) updatedData[key] = value;
            });
            await db.collection('submissions').add({
                review_data: updatedData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chat_id: side === 'left' ? leftChatId : rightChatId,
                uid: currentUserUid
            });
            displayMessage('তথ্য সফলভাবে সংরক্ষিত!', 'bot', side);
            generatePDF(updatedData, reviewCard, side);
            reviewCard.setAttribute('data-confirmed', 'true');
            reviewCard.setAttribute('data-editable', 'false');
            editBtn.disabled = true;
            editBtn.style.display = 'none';
            confirmBtn.style.display = 'none';
            buttonContainer.innerHTML = '';
            const downloadBtn = document.createElement('button');
            downloadBtn.classList.add('download-btn', 'ripple-btn');
            downloadBtn.textContent = 'Download PDF';
            downloadBtn.addEventListener('click', () => {
                const pdfUrl = reviewCard.getAttribute('data-pdf-url');
                if (pdfUrl) {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = decodeURIComponent(pdfUrl.split('/').pop());
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showErrorMessage('পিডিএফ ডাউনলোডের জন্য URL পাওয়া যায়নি।', side);
                }
            });
            buttonContainer.appendChild(downloadBtn);
        } catch (error) {
            showErrorMessage('তথ্য সংরক্ষণে সমস্যা: ' + error.message, side);
            confirmBtn.disabled = false;
        } finally {
            isProcessing = false;
        }
    });
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(confirmBtn);
    reviewCard.appendChild(reviewContent);
    reviewCard.appendChild(buttonContainer);
    messagesContainer.appendChild(reviewCard);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Toggle Edit
function toggleEdit(reviewCard, editBtn, reviewContent, confirmBtn, reviewData, side) {
    if (reviewCard.getAttribute('data-confirmed') === 'true') {
        showErrorMessage('ডেটা কনফার্ম হয়ে গেছে। এডিট করা যাবে না।', side);
        return;
    }
    const isEditable = reviewCard.getAttribute('data-editable') === 'true';
    if (!isEditable) {
        reviewCard.setAttribute('data-editable', 'true');
        editBtn.textContent = 'Save';
        confirmBtn.style.display = 'none';
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const value = item.querySelector('p')?.textContent || item.querySelector('img')?.src;
            item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label>`;
            if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
                const img = document.createElement('img');
                img.src = value;
                item.appendChild(img);
                const replaceInput = document.createElement('input');
                replaceInput.type = 'file';
                replaceInput.classList.add('replace-image-input');
                replaceInput.accept = 'image/png, image/jpeg';
                replaceInput.style.display = 'none';
                item.appendChild(replaceInput);
                const replaceIcon = document.createElement('i');
                replaceIcon.classList.add('fas', 'fa-camera', 'replace-image-icon');
                item.appendChild(replaceIcon);
                replaceIcon.addEventListener('click', () => replaceInput.click());
                replaceInput.addEventListener('change', () => {
                    const file = replaceInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = e => img.src = e.target.result;
                        reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', side);
                        reader.readAsDataURL(file);
                    }
                });
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.classList.add('edit-input');
                item.appendChild(input);
            }
        });
    } else {
        const updatedData = { ...reviewData };
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const input = item.querySelector('input.edit-input');
            const img = item.querySelector('img');
            if (input) {
                const newValue = input.value.trim();
                updatedData[key] = newValue;
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><p>${sanitizeMessage(newValue)}</p>`;
            } else if (img) {
                updatedData[key] = img.src;
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><img src="${img.src}" />`;
            }
        });
        reviewCard.setAttribute('data-editable', 'false');
        editBtn.textContent = 'Edit';
        confirmBtn.style.display = 'inline-block';
    }
}

// Generate PDF
function generatePDF(reviewData, reviewCard, side) {
    const formType = reviewData.form_type || 'generic';
    const payload = {
        reviewData: Object.fromEntries(
            Object.entries(reviewData).map(([key, value]) => [
                key,
                typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) ? '[Image]' : value
            ])
        ),
        formType
    };
    fetch('http://localhost:5000/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.pdf_url) {
                reviewCard.setAttribute('data-pdf-url', data.pdf_url);
                displayMessage('PDF তৈরি ও আপলোড সফল!', 'bot', side);
                saveChatHistory('PDF তৈরি সফল।', 'bot', side);
            } else {
                throw new Error(data.error || 'PDF generation failed');
            }
        })
        .catch(error => {
            showErrorMessage('PDF তৈরিতে সমস্যা: ' + error.message, side);
            saveChatHistory('PDF error: ' + error.message, 'bot', side);
        });
}

// Image Handling Functions
function clearPreview(side) {
    selectedFile = null;
    editedImage = null;
    const previewImage = side === 'left' ? elements.previewImage : elements.previewImageRight;
    const previewContainer = side === 'left' ? elements.previewContainer : elements.previewContainerRight;
    if (previewImage) previewImage.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
}

function openImageModal(src) {
    if (elements.reviewImage) elements.reviewImage.src = src;
    if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
}

function drawImage() {
    if (!ctx) return;
    ctx.clearRect(0, 0, elements.editCanvas.width, elements.editCanvas.height);
    ctx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;
    ctx.fillRect(0, 0, elements.editCanvas.width, elements.editCanvas.height);
    ctx.filter = `brightness(${100 + brightnessValue}%) contrast(${100 + contrastValue}%)`;
    ctx.drawImage(image, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    ctx.filter = 'none';
}

// Genres Modal Functions (for left chat)
function renderGenres() {
    if (!elements.genresList) return;
    elements.genresList.innerHTML = '';
    genres.forEach(genre => {
        const item = document.createElement('div');
        item.className = 'genre-item ripple-btn';
        item.innerHTML = `<i class="${genre.icon}"></i><span>${sanitizeMessage(genre.name)}</span>`;
        item.addEventListener('click', () => {
            elements.genresModal?.classList.add('slide-out');
            setTimeout(() => {
                elements.genresModal.style.display = 'none';
                elements.genresModal.classList.remove('slide-out');
            }, 300);
            if (genre.message) {
                displayMessage(sanitizeMessage(genre.message), 'user', 'left');
                saveChatHistory(sanitizeMessage(genre.message), 'user', 'left');
                callRasaAPI(genre.message, {}, 'left');
                hideWelcomeMessage('left');
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।', 'left');
            }
        });
        elements.genresList.appendChild(item);
    });
}

function openGenresModal() {
    renderGenres();
    if (elements.genresModal) {
        elements.genresModal.classList.add('slide-in');
        elements.genresModal.style.display = 'block';
        setTimeout(() => elements.genresModal.classList.remove('slide-in'), 300);
    }
}

function closeGenresModal() {
    if (elements.genresModal) {
        elements.genresModal.classList.add('slide-out');
        setTimeout(() => {
            elements.genresModal.style.display = 'none';
            elements.genresModal.classList.remove('slide-out');
        }, 300);
    }
}

// Genres2 Modal Functions (for right chat with toggle sub-questions)
function renderGenres2() {
    if (!elements.genres2List) return;
    elements.genres2List.innerHTML = '';
    genres2.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item ripple-btn';
        categoryItem.innerHTML = `<i class="${category.icon}"></i><span>${sanitizeMessage(category.name)}</span>`;
        categoryItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const subQuestionsDiv = categoryItem.nextSibling;
            if (subQuestionsDiv.style.display === 'block') {
                subQuestionsDiv.style.display = 'none';
            } else {
                subQuestionsDiv.style.display = 'block';
            }
        });

        const subQuestionsDiv = document.createElement('div');
        subQuestionsDiv.className = 'sub-questions';
        subQuestionsDiv.style.display = 'none'; // Initially hidden
        category.subQuestions.forEach(subQ => {
            const subItem = document.createElement('div');
            subItem.className = 'sub-question-item ripple-btn';
            subItem.innerHTML = `<span>${sanitizeMessage(subQ.question)}</span>`;
            subItem.addEventListener('click', () => {
                elements.genres2Modal?.classList.add('slide-out');
                setTimeout(() => {
                    elements.genres2Modal.style.display = 'none';
                    elements.genres2Modal.classList.remove('slide-out');
                }, 300);
                if (subQ.message) {
                    displayMessage(sanitizeMessage(subQ.message), 'user', 'right');
                    saveChatHistory(sanitizeMessage(subQ.message), 'user', 'right');
                    callRasaAPI(subQ.message, {}, 'right');
                    hideWelcomeMessage('right');
                } else {
                    showErrorMessage('এই প্রশ্ন উপলব্ধ নয়।', 'right');
                }
            });
            subQuestionsDiv.appendChild(subItem);
        });

        elements.genres2List.appendChild(categoryItem);
        elements.genres2List.appendChild(subQuestionsDiv);
    });
}

function openGenres2Modal() {
    renderGenres2();
    if (elements.genres2Modal) {
        elements.genres2Modal.classList.add('slide-in');
        elements.genres2Modal.style.display = 'block';
        setTimeout(() => elements.genres2Modal.classList.remove('slide-in'), 300);
    }
}

function closeGenres2Modal() {
    if (elements.genres2Modal) {
        elements.genres2Modal.classList.add('slide-out');
        setTimeout(() => {
            elements.genres2Modal.style.display = 'none';
            elements.genres2Modal.classList.remove('slide-out');
        }, 300);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!elements.messagesDiv || !elements.historyList || !elements.messagesRight) {
        console.error('Critical DOM elements not found. Please check your HTML.');
        return;
    }
    initializeApp();
    elements.historyIcon?.addEventListener('click', toggleSidebar);
    elements.closeSidebar?.addEventListener('click', closeSidebarHandler);
    elements.newChatIcon?.addEventListener('click', () => {
        startNewChat('left');
        startNewChat('right');
    });
    elements.searchInput?.addEventListener('input', () => loadChatHistory(elements.searchInput.value.trim()));
    elements.cancelDelete?.addEventListener('click', () => elements.deleteModal.style.display = 'none');
    elements.confirmDelete?.addEventListener('click', deleteChat);
    elements.cancelRename?.addEventListener('click', () => elements.renameModal.style.display = 'none');
    elements.saveRename?.addEventListener('click', renameChat);
    elements.sendBtn?.addEventListener('click', () => sendMessage('left'));
    elements.userInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.repeat) sendMessage('left');
    });
    elements.sendBtnRight?.addEventListener('click', () => sendMessage('right'));
    elements.userInputRight?.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.repeat) sendMessage('right');
    });
    elements.uploadBtn?.addEventListener('click', () => elements.fileInput?.click());
    elements.fileInput?.addEventListener('change', () => {
        const file = elements.fileInput.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                if (elements.previewImage) elements.previewImage.src = e.target.result;
                if (elements.previewContainer) elements.previewContainer.style.display = 'block';
            };
            reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', 'left');
            reader.readAsDataURL(file);
        }
        elements.fileInput.value = '';
    });
    elements.uploadBtnRight?.addEventListener('click', () => elements.fileInputRight?.click());
    elements.fileInputRight?.addEventListener('change', () => {
        const file = elements.fileInputRight.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                if (elements.previewImageRight) elements.previewImageRight.src = e.target.result;
                if (elements.previewContainerRight) elements.previewContainerRight.style.display = 'block';
            };
            reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', 'right');
            reader.readAsDataURL(file);
        }
        elements.fileInputRight.value = '';
    });
    elements.previewImage?.addEventListener('click', () => {
        if (elements.reviewImage) elements.reviewImage.src = elements.previewImage.src;
        if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
    });
    elements.previewImageRight?.addEventListener('click', () => {
        if (elements.reviewImage) elements.reviewImage.src = elements.previewImageRight.src;
        if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
    });
    elements.previewImage?.addEventListener('dblclick', () => {
        if (elements.previewImage) {
            image.src = elements.previewImage.src || '';
            image.onload = () => {
                if (elements.editCanvas) {
                    elements.editCanvas.width = image.width;
                    elements.editCanvas.height = image.height;
                    cropRect.width = Math.min(200, image.width);
                    cropRect.height = Math.min(200, image.height);
                    drawImage();
                    if (elements.editModal) elements.editModal.style.display = 'block';
                }
            };
        }
    });
    elements.previewImageRight?.addEventListener('dblclick', () => {
        if (elements.previewImageRight) {
            image.src = elements.previewImageRight.src || '';
            image.onload = () => {
                if (elements.editCanvas) {
                    elements.editCanvas.width = image.width;
                    elements.editCanvas.height = image.height;
                    cropRect.width = Math.min(200, image.width);
                    cropRect.height = Math.min(200, image.height);
                    drawImage();
                    if (elements.editModal) elements.editModal.style.display = 'block';
                }
            };
        }
    });
    elements.cropX?.addEventListener('input', e => { cropRect.x = parseInt(e.target.value); drawImage(); });
    elements.cropY?.addEventListener('input', e => { cropRect.y = parseInt(e.target.value); drawImage(); });
    elements.cropWidth?.addEventListener('input', e => { cropRect.width = parseInt(e.target.value); drawImage(); });
    elements.cropHeight?.addEventListener('input', e => { cropRect.height = parseInt(e.target.value); drawImage(); });
    elements.brightness?.addEventListener('input', e => { brightnessValue = parseInt(e.target.value); drawImage(); });
    elements.contrast?.addEventListener('input', e => { contrastValue = parseInt(e.target.value); drawImage(); });
    elements.backgroundColor?.addEventListener('change', e => { bgColor = e.target.value; drawImage(); });
    elements.editApplyBtn?.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropRect.width;
        tempCanvas.height = cropRect.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && editedImage) {
            tempCtx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;
            tempCtx.fillRect(0, 0, cropRect.width, cropRect.height);
            tempCtx.filter = `brightness(${100 + brightnessValue}%) contrast(${100 + contrastValue}%)`;
            tempCtx.drawImage(image, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);
            editedImage = tempCanvas.toDataURL('image/jpeg');
            if (elements.previewImage.src) elements.previewImage.src = editedImage;
            if (elements.previewImageRight.src) elements.previewImageRight.src = editedImage;
            callRasaAPI("show_review");
            if (elements.editModal) elements.editModal.style.display = 'none';
        }
    });
    elements.editCancelBtn?.addEventListener('click', () => {
        if (elements.editModal) elements.editModal.style.display = 'none';
    });
    elements.imageReviewModal?.addEventListener('click', e => {
        if (e.target === elements.imageReviewModal || e.target === elements.deleteImageBtn) {
            if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'none';
        }
    });
    elements.deleteImageBtn?.addEventListener('click', () => {
        clearPreview('left');
        clearPreview('right');
        if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'none';
    });
    elements.moreOptionsBtn?.addEventListener('click', openGenresModal); // Left "আরও" opens genresModal
    elements.moreOptionsBtnRight?.addEventListener('click', openGenres2Modal); // Right "আরও" opens genres2Modal
    elements.closeGenresModal?.addEventListener('click', closeGenresModal);
    elements.closeGenres2Modal?.addEventListener('click', closeGenres2Modal);
    document.querySelectorAll('.welcome-buttons button[data-genre]').forEach(button => {
        button.classList.add('ripple-btn');
        button.addEventListener('click', () => {
            const genreName = button.getAttribute('data-genre');
            const genre = genres.find(g => g.name === genreName);
            if (genre?.message) {
                // Determine the side based on the parent welcome-message
                const side = button.closest('#welcomeMessage') ? 'left' : 'right';
                displayMessage(sanitizeMessage(genre.message), 'user', side);
                saveChatHistory(genre.message, 'user', side);
                callRasaAPI(genre.message, {}, side);
                hideWelcomeMessage(side);
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।', button.closest('#welcomeMessage') ? 'left' : 'right');
            }
        });
    });
});