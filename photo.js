// ============================================
// photo.js - ClowAI Pinterest Photo Management
// ============================================

const PhotoManager = {
  maxPhotosPerQuery: 50,
  apiBase: 'https://api.pinterest.com/v5',
  
  init() {
    console.log('📸 ClowAI Photo Manager Initialized');
  },
  
  async searchPinterest(query, apiToken) {
    if (!apiToken || apiToken === 'YOUR_PINTEREST_TOKEN') {
      console.warn('⚠️ Pinterest API token not configured. Using placeholders.');
      return this.getPlaceholderImages(query);
    }
    
    try {
      const url = `${this.apiBase}/search/pins?query=${encodeURIComponent(query)}&page_size=${this.maxPhotosPerQuery}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Pinterest API Error: ${response.status}`);
      
      const data = await response.json();
      const imageUrls = (data.items || [])
        .map(item => item.media?.images?.original?.url)
        .filter(Boolean);
      
      // Save to memory
      if (typeof MemoryManager !== 'undefined') {
        MemoryManager.savePhotos(query, imageUrls);
      }
      
      console.log(`📸 Pinterest: Found ${imageUrls.length} images for "${query}"`);
      return imageUrls;
      
    } catch (error) {
      console.error('❌ Pinterest search error:', error.message);
      
      // Try cached photos
      if (typeof MemoryManager !== 'undefined') {
        const cached = MemoryManager.getPhotos(query);
        if (cached.length > 0) {
          console.log('📦 Using cached photos');
          return cached;
        }
      }
      
      return this.getPlaceholderImages(query);
    }
  },
  
  getPlaceholderImages(query) {
    console.log('🖼️ Generating placeholder images');
    const images = [];
    for (let i = 1; i <= this.maxPhotosPerQuery; i++) {
      images.push(`https://picsum.photos/400/300?random=${i}&query=${encodeURIComponent(query)}`);
    }
    return images;
  },
  
  async getPhotoCollections() {
    if (typeof MemoryManager !== 'undefined') {
      const memory = MemoryManager.getAll();
      const photos = memory.photos || {};
      return Object.entries(photos).map(([query, data]) => ({
        query,
        count: data.count || 0,
        timestamp: data.timestamp,
        preview: data.images?.[0] || null
      }));
    }
    return [];
  },
  
  deletePhotoCollection(query) {
    if (typeof MemoryManager !== 'undefined') {
      MemoryManager.save('photos', MemoryManager.getAll().photos || {});
      console.log(`🗑️ Deleted photo collection: ${query}`);
      return true;
    }
    return false;
  },
  
  getTotalPhotos() {
    if (typeof MemoryManager !== 'undefined') {
      return MemoryManager.getStorageStats().totalPhotos;
    }
    return 0;
  }
};

PhotoManager.init();
if (typeof module !== 'undefined') module.exports = PhotoManager;