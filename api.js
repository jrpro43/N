// ============================================
// api.js - ClowAI API Key Management
// ============================================

const ApiKeyManager = {
  keyPrefix: 'CSK',
  keyLength: 63,
  
  init() {
    console.log('🔑 ClowAI API Key Manager Initialized');
    console.log('📝 API Key Format: CSK-XXX...XXX (63 characters)');
  },
  
  generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = this.keyPrefix;
    
    // Generate 60 random characters (total = 63 with prefix)
    for (let i = 0; i < 60; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.log('✅ New API Key generated');
    return key;
  },
  
  validateKey(key) {
    if (!key || typeof key !== 'string') return false;
    
    // Check length
    if (key.length !== this.keyLength) return false;
    
    // Check prefix
    if (!key.startsWith(this.keyPrefix)) return false;
    
    // Check characters (only alphanumeric)
    const keyBody = key.substring(3);
    const validChars = /^[A-Za-z0-9]+$/;
    if (!validChars.test(keyBody)) return false;
    
    return true;
  },
  
  async saveKeyToFirebase(key, userData) {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn('⚠️ Firebase not available. Key saved locally only.');
      this.saveKeyLocally(key);
      return false;
    }
    
    try {
      const db = firebase.firestore();
      await db.collection('apiKeys').doc(key).set({
        userId: userData.uid,
        email: userData.email,
        name: userData.displayName || 'User',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true,
        lastUsed: null
      });
      
      console.log('☁️ API Key saved to Firebase');
      return true;
    } catch (error) {
      console.error('❌ Firebase save error:', error);
      this.saveKeyLocally(key);
      return false;
    }
  },
  
  saveKeyLocally(key) {
    localStorage.setItem('clowai_api_key', key);
    console.log('💾 API Key saved locally');
  },
  
  getLocalKey() {
    return localStorage.getItem('clowai_api_key') || null;
  },
  
  // Python example code
  getPythonExample() {
    return `
# ============================================
# ClowAI Python Integration Example
# ============================================

import requests

# Your ClowAI API Key (63 characters starting with CSK)
API_KEY = "CSK-XXXX...XXXX"  # Replace with your real key

# API Configuration
API_URL = "https://api.clowai.com/v1/chat"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def chat_with_clowai(message):
    """Send message to ClowAI and get response"""
    try:
        response = requests.post(
            API_URL,
            headers=HEADERS,
            json={
                "message": message,
                "model": "clowai-v3"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("reply", "No response")
        else:
            return f"Error: {response.status_code}"
            
    except Exception as e:
        return f"Error: {str(e)}"

# Example usage
if __name__ == "__main__":
    # Test message
    reply = chat_with_clowai("Who are you?")
    print(f"ClowAI: {reply}")

# ============================================
# Telegram Bot Example
# ============================================

import telebot

BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
CLOWAI_API_KEY = "CSK-XXXX...XXXX"

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    """Handle all incoming messages"""
    response = requests.post(
        "https://api.clowai.com/v1/chat",
        headers={"Authorization": f"Bearer {CLOWAI_API_KEY}"},
        json={"message": message.text}
    )
    
    if response.status_code == 200:
        reply = response.json().get("reply", "Error")
        bot.reply_to(message, reply)
    else:
        bot.reply_to(message, "Sorry, I'm having trouble. Try again later.")

# Start bot
print("🤖 ClowAI Telegram Bot Started!")
bot.polling(none_stop=True)
`;
  },
  
  getTelegramExample() {
    return `
# ============================================
# ClowAI Telegram Bot - Full Example
# ============================================

import telebot
import requests
import json

# Configuration
BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
CLOWAI_API_KEY = "CSK-XXXX...XXXX"  # Your 63-char API key
CLOWAI_API_URL = "https://api.clowai.com/v1/chat"

bot = telebot.TeleBot(BOT_TOKEN)

# Command handlers
@bot.message_handler(commands=['start'])
def send_welcome(message):
    welcome_text = """
🤖 *Welcome to ClowAI Bot!*

I am ClowAI, developed by Hemat.
Send me any message and I'll help you!

🔑 Powered by ClowAI API
📘 Facebook: https://www.facebook.com/profile.php?id=61591053177770
    """
    bot.reply_to(message, welcome_text, parse_mode='Markdown')

@bot.message_handler(commands=['help'])
def send_help(message):
    help_text = """
*ClowAI Bot Commands:*
/start - Welcome message
/help - This help menu
/about - About ClowAI

Just send any message to chat with AI!
    """
    bot.reply_to(message, help_text, parse_mode='Markdown')

@bot.message_handler(commands=['about'])
def send_about(message):
    about_text = """
*About ClowAI:*
🤖 Name: ClowAI
👨‍💻 Developer: Hemat
📘 Facebook: fb.com/61591053177770
🔑 API: api.clowai.com

I am a custom AI, not ChatGPT!
    """
    bot.reply_to(message, about_text, parse_mode='Markdown')

@bot.message_handler(func=lambda message: True)
def handle_message(message):
    """Process all messages through ClowAI"""
    try:
        # Send typing action
        bot.send_chat_action(message.chat.id, 'typing')
        
        # Call ClowAI API
        headers = {
            "Authorization": f"Bearer {CLOWAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "message": message.text,
            "user_id": str(message.from_user.id),
            "user_name": message.from_user.first_name
        }
        
        response = requests.post(
            CLOWAI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get("reply", "I couldn't process that.")
            
            # Add source info
            if len(reply) > 4000:
                # Split long messages
                for i in range(0, len(reply), 4000):
                    bot.reply_to(message, reply[i:i+4000])
            else:
                bot.reply_to(
                    message,
                    f"{reply}\n\n🤖 _ClowAI by Hemat_",
                    parse_mode='Markdown'
                )
        else:
            bot.reply_to(message, f"❌ API Error: {response.status_code}")
            
    except requests.exceptions.Timeout:
        bot.reply_to(message, "⏰ Request timed out. Please try again.")
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

# Start the bot
if __name__ == "__main__":
    print("🤖 ClowAI Telegram Bot is running...")
    print("👨‍💻 Developed by Hemat")
    print("📘 Facebook: https://www.facebook.com/profile.php?id=61591053177770")
    bot.polling(none_stop=True)
`;
  }
};

ApiKeyManager.init();
if (typeof module !== 'undefined') module.exports = ApiKeyManager;