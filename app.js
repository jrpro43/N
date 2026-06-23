// ============================================
// app.js - ClowAI Main Application
// ============================================

const ADMIN_EMAIL = "hematking992@gmail.com";
const FACEBOOK_PAGE = "https://www.facebook.com/profile.php?id=61591053177770";
const DEVELOPER_NAME = "Hemat";

// API Keys - Replace with your real keys
const QWEN_API_KEY = "sk-ws-H.IRHEPY.hSui.MEYCIQDiK2-tuF51VD1_O2uN6WudTu_AQK85sXR7Hqo6TVHzJgIhAKJ-3OhGD1TxKyXKjaMhSXSAT5hc629TbFfJul1MHimf";
const GEMINI_API_KEY = "AQ.Ab8RN6IYcfuSCQvBpU2gk1TW6ST0cmYOrg_h0jY3e_YR2brQxw";
const PINTEREST_TOKEN = "YOUR_PINTEREST_TOKEN";

const QWEN_API_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

let currentUser = null;
let isAdmin = false;
let currentPage = 'chat';

// Firebase instances
const firebaseConfig = {
  apiKey: "AIzaSyAcZetecRzDRuOHxsNge0uH770_HMpeY3M",
  authDomain: "clowai1v.firebaseapp.com",
  projectId: "clowai1v",
  storageBucket: "clowai1v.firebasestorage.app",
  messagingSenderId: "82096858124",
  appId: "1:82096858124:web:cd33d3b27c1da365867a29",
  measurementId: "G-D1ZBCBH590"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================
// CLOWAI IDENTITY SYSTEM
// ============================================
const CLOWAI_IDENTITY = {
  name: "ClowAI",
  developer: "Hemat",
  version: "3.0.0",
  facebook: "https://www.facebook.com/profile.php?id=61591053177770",
  
  getIdentityResponse() {
    return `I am **${this.name}**, an AI assistant developed by **${this.developer}**. 

I am NOT ChatGPT or Gemini - I am ClowAI, a custom AI system built by Hemat.

🌐 **Follow us on Facebook:** ${this.facebook}

**Version:** ${this.version}
**Developer:** ${this.developer}`;
  },
  
  getSystemPrompt() {
    return `You are ClowAI, an AI assistant created by Hemat.
    
IMPORTANT RULES:
1. NEVER say you are ChatGPT, GPT, or Gemini
2. ALWAYS identify yourself as "ClowAI"
3. If asked who created/made you, ALWAYS say "I was created by Hemat"
4. If asked your name, ALWAYS say "I am ClowAI"
5. Share your Facebook page when relevant: ${this.facebook}
6. Reply in the SAME language as the user
7. Be helpful, friendly, and professional
8. Developer name: Hemat (always remember this)

Remember: You are ClowAI - a unique AI, not ChatGPT or any other AI.`;
  }
};

// ============================================
// AUTH STATE LISTENER
// ============================================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    isAdmin = (user.email === ADMIN_EMAIL);
    
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    document.getElementById('userName').textContent = user.displayName || 'User';
    document.getElementById('userAvatar').src = user.photoURL || 'https://i.postimg.cc/Wb8c2DFr/file-00000000974071f58a753a2f8b810e7c.png';
    
    setupMenus();
    setupEventListeners();
    await loadStorageData();
    
  } else {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
  }
});

// ============================================
// MENU SETUP
// ============================================
function setupMenus() {
  document.getElementById('adminMenu').style.display = isAdmin ? 'block' : 'none';
  document.getElementById('userMenu').style.display = isAdmin ? 'none' : 'block';
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
      document.getElementById('userDropdown').classList.remove('show');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('sidebar').classList.remove('show');
      document.getElementById('sidebarOverlay').classList.remove('show');
    }
  });
  
  const inputEl = document.getElementById('chatInput');
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

// ============================================
// AUTH FUNCTIONS
// ============================================
function toggleAuth() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const subtitle = document.getElementById('authSubtitle');
  
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    subtitle.textContent = 'Sign in to continue';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    subtitle.textContent = 'Create your account';
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    showToast('Signing in...');
    await auth.signInWithEmailAndPassword(email, password);
    showToast('Welcome to ClowAI! 🚀');
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  
  try {
    showToast('Creating account...');
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName: name });
    
    await db.collection('users').doc(result.user.uid).set({
      email, name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      apiKeys: 0
    });
    
    showToast('Account created! Welcome to ClowAI!');
  } catch (error) {
    showToast(error.message);
  }
});

async function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    showToast('Signing in with Google...');
    const result = await auth.signInWithPopup(provider);
    
    const userDoc = await db.collection('users').doc(result.user.uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(result.user.uid).set({
        email: result.user.email,
        name: result.user.displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        apiKeys: 0
      });
    }
    
    showToast('Welcome to ClowAI! 🚀');
  } catch (error) {
    showToast(error.message);
  }
}

async function signOutUser() {
  await auth.signOut();
  showToast('Signed out successfully');
}

// ============================================
// UI FUNCTIONS
// ============================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('show');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

function toggleTheme() {
  const body = document.body;
  const btn = document.querySelector('.themeBtn');
  if (body.classList.contains('light')) {
    body.classList.remove('light'); body.classList.add('dark');
    btn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark'); body.classList.add('light');
    btn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('show');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// PAGE NAVIGATION
// ============================================
async function showPage(page) {
  currentPage = page;
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active-page'));
  
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  
  if (page === 'data') await loadStorageData();
  if (page === 'admin' && isAdmin) await loadAdminPanel();
  
  toggleSidebar();
}

// ============================================
// STORAGE DATA
// ============================================
async function loadStorageData() {
  const stats = MemoryManager.getStorageStats();
  
  document.getElementById('memorySize').textContent = stats.chats.kb + ' KB';
  document.getElementById('photoSize').textContent = stats.photos.kb + ' KB';
  document.getElementById('totalSize').textContent = stats.total.kb + ' KB';
  
  document.getElementById('memoryBar').style.width = Math.min((stats.chats.bytes / 1024 / 10), 100) + '%';
  document.getElementById('photoBar').style.width = Math.min((stats.photos.bytes / 1024 / 10), 100) + '%';
  document.getElementById('totalBar').style.width = Math.min((stats.total.bytes / 1024 / 10), 100) + '%';
  
  const tableBody = document.getElementById('storageTable');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr><td>Memory</td><td>${stats.chats.bytes}</td><td>${stats.chats.kb}</td><td>${stats.chats.mb}</td><td>0</td><td>0</td></tr>
      <tr><td>Photos</td><td>${stats.photos.bytes}</td><td>${stats.photos.kb}</td><td>${stats.photos.mb}</td><td>0</td><td>0</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>${stats.total.bytes}</strong></td><td><strong>${stats.total.kb}</strong></td><td><strong>${stats.total.mb}</strong></td><td><strong>${stats.total.gb}</strong></td><td>0</td></tr>
    `;
  }
}

// ============================================
// ADMIN PANEL
// ============================================
async function loadAdminPanel() {
  if (!isAdmin) return;
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const apiKeysSnapshot = await db.collection('apiKeys').get();
    
    document.getElementById('totalUsers').textContent = usersSnapshot.size;
    document.getElementById('totalApiKeys').textContent = apiKeysSnapshot.size;
    document.getElementById('totalChats').textContent = MemoryManager.getStorageStats().chatCount;
    document.getElementById('totalPhotos').textContent = MemoryManager.getStorageStats().totalPhotos;
    
    const usersTable = document.getElementById('usersTable');
    if (usersTable) {
      usersTable.innerHTML = '';
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${data.email || 'N/A'}</td>
          <td>${data.name || 'N/A'}</td>
          <td>${data.apiKeys || 0}</td>
          <td>${data.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
        `;
        usersTable.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Admin panel error:', error);
  }
}

// ============================================
// AI CHAT SYSTEM
// ============================================
function quickAsk(question) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = question;
    sendMessage();
  }
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  
  // Check for identity questions
  const identityCheck = checkIdentityQuestion(text);
  if (identityCheck) {
    addMessage('user', text);
    input.value = '';
    
    // Small delay for natural feel
    await sleep(500);
    
    const response = CLOWAI_IDENTITY.getIdentityResponse();
    addMessage('ai', response, true);
    
    MemoryManager.save('lastIdentityCheck', { question: text, timestamp: Date.now() });
    return;
  }
  
  // Add user message
  addMessage('user', text);
  input.value = '';
  
  // Show typing indicator
  const chatContainer = document.getElementById('chatContainer');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-msg';
  typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  try {
    // Try Gemini first
    let answer = await fetchFromGemini(text);
    let source = 'ClowAI + Gemini';
    
    // Fallback to Qwen
    if (!answer) {
      answer = await fetchFromQwen(text);
      source = 'ClowAI';
    }
    
    // Remove typing indicator
    typingDiv.remove();
    
    // Add AI response
    addMessage('ai', answer, true, source);
    
    // Search Pinterest for images
    await searchAndShowImages(text);
    
    // Save to memory
    MemoryManager.save(`chat_${Date.now()}`, {
      user: text,
      ai: answer,
      source: source,
      timestamp: Date.now()
    });
    
  } catch (error) {
    typingDiv.remove();
    addMessage('ai', '❌ Error: ' + error.message, false, 'Error');
  }
}

// ============================================
// IDENTITY CHECK
// ============================================
function checkIdentityQuestion(text) {
  const lowerText = text.toLowerCase();
  
  const identityTriggers = [
    'who are you', 'what are you', 'your name', 'what is your name',
    'who made you', 'who created you', 'who developed you',
    'are you chatgpt', 'are you gpt', 'are you gemini',
    'what ai are you', 'which ai are you', 'tell me about yourself',
    'introduce yourself', 'who is your creator', 'who built you',
    'ته څوک یې', 'ته چا جوړ کړی یې', 'ستا نوم څه دی',
    'آیا ته چت جی پی ټی یې', 'آیا ته جیمینای یې'
  ];
  
  return identityTriggers.some(trigger => lowerText.includes(trigger));
}

// ============================================
// FETCH FROM GEMINI
// ============================================
async function fetchFromGemini(query) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${CLOWAI_IDENTITY.getSystemPrompt()}\n\nUser: ${query}\nClowAI:`
          }]
        }]
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    
  } catch (error) {
    console.error('Gemini error:', error);
    return null;
  }
}

// ============================================
// FETCH FROM QWEN
// ============================================
async function fetchFromQwen(query) {
  try {
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: CLOWAI_IDENTITY.getSystemPrompt() },
          { role: "user", content: query }
        ]
      })
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Qwen error:', error);
    return null;
  }
}

// ============================================
// SEARCH PINTEREST IMAGES
// ============================================
async function searchAndShowImages(query) {
  try {
    // Extract search terms
    let searchQuery = query.replace(/who is|what is|show me|image of|picture of|photo of/gi, '').trim();
    if (!searchQuery) searchQuery = query;
    
    const images = await PhotoManager.searchPinterest(searchQuery, PINTEREST_TOKEN);
    
    if (images.length > 0) {
      const chatContainer = document.getElementById('chatContainer');
      const imgDiv = document.createElement('div');
      imgDiv.className = 'ai-images';
      imgDiv.innerHTML = `
        <p>📸 Found ${images.length} images for "${searchQuery}"</p>
        <div class="image-grid">
          ${images.slice(0, 50).map(url => `<img src="${url}" alt="Result" loading="lazy" onerror="this.style.display='none'">`).join('')}
        </div>
      `;
      chatContainer.appendChild(imgDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      
      // Update photo count
      db.collection('stats').doc('global').update({
        totalPhotos: firebase.firestore.FieldValue.increment(images.length)
      }).catch(() => {
        db.collection('stats').doc('global').set({ totalPhotos: images.length });
      });
    }
  } catch (error) {
    console.error('Image search error:', error);
  }
}

// ============================================
// ADD MESSAGE TO CHAT
// ============================================
function addMessage(role, text, isMarkdown = false, source = '') {
  const chatContainer = document.getElementById('chatContainer');
  
  // Remove welcome message if exists
  const welcome = chatContainer.querySelector('.welcome-message');
  if (welcome) welcome.remove();
  
  const div = document.createElement('div');
  div.className = role === 'user' ? 'user-msg' : 'ai-msg';
  
  if (role === 'ai' && isMarkdown) {
    try {
      div.innerHTML = marked.parse(text);
    } catch (e) {
      div.innerText = text;
    }
  } else {
    div.innerText = text;
  }
  
  // Add source label
  if (source && role === 'ai') {
    const sourceLabel = document.createElement('span');
    sourceLabel.className = 'source-label';
    sourceLabel.textContent = `🤖 ${source}`;
    div.appendChild(sourceLabel);
  }
  
  // Add Facebook badge for identity responses
  if (role === 'ai' && text.includes('ClowAI')) {
    const fbBadge = document.createElement('a');
    fbBadge.href = FACEBOOK_PAGE;
    fbBadge.target = '_blank';
    fbBadge.className = 'facebook-badge';
    fbBadge.innerHTML = '<i class="fab fa-facebook"></i> Follow us';
    div.appendChild(fbBadge);
  }
  
  // Add copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
  copyBtn.onclick = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
    });
  };
  div.appendChild(copyBtn);
  
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ============================================
// API KEY FUNCTIONS
// ============================================
function showApiKeyModal() {
  document.getElementById('userDropdown').classList.remove('show');
  document.getElementById('apiKeyModal').classList.add('show');
  
  // Show existing key if available
  const existingKey = localStorage.getItem('clowai_api_key');
  if (existingKey) {
    document.getElementById('apiKeyDisplay').textContent = existingKey;
  }
}

function closeApiKeyModal() {
  document.getElementById('apiKeyModal').classList.remove('show');
}

async function generateApiKey() {
  const apiKey = ApiKeyManager.generateKey();
  document.getElementById('apiKeyDisplay').textContent = apiKey;
  
  // Save locally
  localStorage.setItem('clowai_api_key', apiKey);
  
  // Save to Firebase
  if (currentUser) {
    try {
      await db.collection('apiKeys').doc(apiKey).set({
        userId: currentUser.uid,
        email: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true
      });
      
      await db.collection('users').doc(currentUser.uid).update({
        apiKeys: firebase.firestore.FieldValue.increment(1),
        lastApiKey: apiKey
      });
      
      // Update stats
      db.collection('stats').doc('global').update({
        totalApiKeys: firebase.firestore.FieldValue.increment(1)
      }).catch(() => {
        db.collection('stats').doc('global').set({ totalApiKeys: 1 });
      });
      
    } catch (error) {
      console.error('Save API key error:', error);
    }
  }
  
  showToast('API Key generated successfully! ✅');
}

function copyApiKey() {
  const key = document.getElementById('apiKeyDisplay').textContent;
  if (key && key !== 'No API Key generated') {
    navigator.clipboard.writeText(key).then(() => {
      showToast('API Key copied! 📋');
    });
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load saved theme
(function() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    const btn = document.querySelector('.themeBtn');
    if (btn) btn.textContent = '☀️';
  }
  
  // Initialize API Key Manager
  ApiKeyManager.init();
})();

console.log('🤖 ClowAI v3.0.0 Ready!');
console.log('👨‍💻 Developed by Hemat');
console.log('📘 Facebook:', FACEBOOK_PAGE);
console.log('💡 I am ClowAI, not ChatGPT or Gemini!');