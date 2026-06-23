// ============================================
// memory.js - ClowAI Memory Management
// ============================================

const MemoryManager = {
  storageKey: 'clowai_memory',
  maxStorageMB: 100,
  
  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        chats: {},
        photos: {},
        identity: {
          name: 'ClowAI',
          developer: 'Hemat',
          version: '3.0.0',
          facebook: 'https://www.facebook.com/profile.php?id=61591053177770'
        },
        stats: {
          created: new Date().toISOString(),
          totalChats: 0,
          totalPhotos: 0
        }
      }));
    }
    console.log('🧠 ClowAI Memory Initialized');
  },
  
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch(e) {
      return {};
    }
  },
  
  save(key, data) {
    try {
      const memory = this.getAll();
      memory[key] = {
        data: data,
        timestamp: Date.now(),
        size: new Blob([JSON.stringify(data)]).size
      };
      localStorage.setItem(this.storageKey, JSON.stringify(memory));
      
      // Update stats
      if (key.startsWith('chat_')) memory.stats.totalChats++;
      if (key.startsWith('photo_')) memory.stats.totalPhotos++;
      
      console.log(`💾 Memory saved: ${key}`);
      return true;
    } catch(e) {
      console.error('❌ Memory save error:', e);
      return false;
    }
  },
  
  get(key) {
    const memory = this.getAll();
    return memory[key]?.data || null;
  },
  
  saveChat(chatId, messages) {
    const memory = this.getAll();
    if (!memory.chats) memory.chats = {};
    memory.chats[chatId] = {
      messages: messages,
      timestamp: Date.now(),
      messageCount: messages.length
    };
    memory.stats.totalChats = Object.keys(memory.chats).length;
    localStorage.setItem(this.storageKey, JSON.stringify(memory));
  },
  
  getChat(chatId) {
    const memory = this.getAll();
    return memory.chats?.[chatId]?.messages || [];
  },
  
  savePhotos(query, imageUrls) {
    const memory = this.getAll();
    if (!memory.photos) memory.photos = {};
    memory.photos[query] = {
      images: imageUrls.slice(0, 50),
      count: Math.min(imageUrls.length, 50),
      timestamp: Date.now()
    };
    memory.stats.totalPhotos = Object.values(memory.photos).reduce((sum, p) => sum + p.count, 0);
    localStorage.setItem(this.storageKey, JSON.stringify(memory));
    console.log(`🖼️ Photos saved: ${query} (${imageUrls.length} images)`);
  },
  
  getPhotos(query) {
    const memory = this.getAll();
    return memory.photos?.[query]?.images || [];
  },
  
  getStorageStats() {
    const memory = this.getAll();
    let totalBytes = new Blob([JSON.stringify(memory)]).size;
    let chatBytes = memory.chats ? new Blob([JSON.stringify(memory.chats)]).size : 0;
    let photoBytes = memory.photos ? new Blob([JSON.stringify(memory.photos)]).size : 0;
    
    return {
      total: {
        bytes: totalBytes,
        kb: (totalBytes / 1024).toFixed(2),
        mb: (totalBytes / (1024 * 1024)).toFixed(4),
        gb: (totalBytes / (1024 * 1024 * 1024)).toFixed(8)
      },
      chats: {
        bytes: chatBytes,
        kb: (chatBytes / 1024).toFixed(2),
        mb: (chatBytes / (1024 * 1024)).toFixed(4)
      },
      photos: {
        bytes: photoBytes,
        kb: (photoBytes / 1024).toFixed(2),
        mb: (photoBytes / (1024 * 1024)).toFixed(4)
      },
      chatCount: memory.chats ? Object.keys(memory.chats).length : 0,
      photoCount: memory.photos ? Object.keys(memory.photos).length : 0,
      totalPhotos: memory.stats?.totalPhotos || 0
    };
  },
  
  isStorageFull() {
    const stats = this.getStorageStats();
    return parseFloat(stats.total.mb) > this.maxStorageMB;
  },
  
  clearAll() {
    if (confirm('Delete all ClowAI memory? This cannot be undone!')) {
      localStorage.removeItem(this.storageKey);
      this.init();
      console.log('🗑️ All memory cleared');
    }
  },
  
  clearOldData(daysOld = 30) {
    const memory = this.getAll();
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let cleared = 0;
    
    Object.keys(memory).forEach(key => {
      if (memory[key]?.timestamp < cutoff) {
        delete memory[key];
        cleared++;
      }
    });
    
    localStorage.setItem(this.storageKey, JSON.stringify(memory));
    console.log(`🧹 Cleared ${cleared} old memory entries`);
    return cleared;
  },
  
  exportMemory() {
    return JSON.stringify(this.getAll(), null, 2);
  },
  
  importMemory(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch(e) {
      return false;
    }
  }
};

MemoryManager.init();
if (typeof module !== 'undefined') module.exports = MemoryManager;