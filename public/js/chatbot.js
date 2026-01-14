/**
 * The AIgnc - AI Chatbot
 */

class AIgncChatbot {
  constructor() {
    this.chatWindow = document.getElementById('chatbotWindow');
    this.chatToggle = document.getElementById('chatbotToggle');
    this.chatClose = document.getElementById('chatbotClose');
    this.chatMessages = document.getElementById('chatbotMessages');
    this.chatForm = document.getElementById('chatbotForm');
    this.chatInput = document.getElementById('chatInput');
    this.suggestions = document.getElementById('chatbotSuggestions');
    this.badge = document.querySelector('.chatbot-badge');

    this.conversationHistory = [];
    this.isOpen = false;
    this.isTyping = false;

    this.init();
  }

  init() {
    // Toggle chat window
    this.chatToggle.addEventListener('click', () => this.toggle());
    this.chatClose.addEventListener('click', () => this.close());

    // Handle form submit
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Handle suggestions
    this.suggestions.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.chatInput.value = btn.textContent;
        this.sendMessage();
      });
    });

    // Load suggestions from API
    this.loadSuggestions();

    // Hide badge when opened
    this.badge.style.display = 'flex';
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.chatWindow.classList.add('active');
    this.chatInput.focus();
    this.badge.style.display = 'none';
  }

  close() {
    this.isOpen = false;
    this.chatWindow.classList.remove('active');
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isTyping) return;

    // Add user message
    this.addMessage(message, 'user');
    this.chatInput.value = '';

    // Add to history
    this.conversationHistory.push({ role: 'user', content: message });

    // Show typing indicator
    this.showTyping();

    try {
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory.slice(-10)
        })
      });

      const data = await response.json();

      this.hideTyping();

      if (data.success) {
        this.addMessage(data.reply, 'bot');
        this.conversationHistory.push({ role: 'assistant', content: data.reply });
      } else {
        this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    } catch (err) {
      this.hideTyping();
      this.addMessage('Connection error. Please check your internet and try again.', 'bot');
    }

    // Hide suggestions after first message
    if (this.suggestions) {
      this.suggestions.style.display = 'none';
    }
  }

  addMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    messageEl.innerHTML = `
      <div class="message-content">
        <p>${this.formatMessage(text)}</p>
      </div>
    `;

    this.chatMessages.appendChild(messageEl);
    this.scrollToBottom();
  }

  formatMessage(text) {
    // Convert URLs to links
    text = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );

    // Convert line breaks
    text = text.replace(/\n/g, '<br>');

    return text;
  }

  showTyping() {
    this.isTyping = true;
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message bot typing-indicator';
    typingEl.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    // Add styles for typing dots
    const style = document.createElement('style');
    style.textContent = `
      .typing-dots {
        display: flex;
        gap: 4px;
        padding: 4px 0;
      }
      .typing-dots span {
        width: 8px;
        height: 8px;
        background: var(--color-slate);
        border-radius: 50%;
        animation: typingBounce 1.4s infinite ease-in-out;
      }
      .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
      .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes typingBounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    this.chatMessages.appendChild(typingEl);
    this.scrollToBottom();
  }

  hideTyping() {
    this.isTyping = false;
    const typingEl = this.chatMessages.querySelector('.typing-indicator');
    if (typingEl) typingEl.remove();
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  async loadSuggestions() {
    try {
      const response = await fetch('/api/chatbot/suggestions');
      const data = await response.json();

      if (data.success && data.suggestions) {
        this.suggestions.innerHTML = data.suggestions
          .slice(0, 3)
          .map(s => `<button class="suggestion-btn">${s}</button>`)
          .join('');

        // Re-attach event listeners
        this.suggestions.querySelectorAll('.suggestion-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.chatInput.value = btn.textContent;
            this.sendMessage();
          });
        });
      }
    } catch (err) {
      console.log('Could not load suggestions');
    }
  }
}

// Initialize chatbot
document.addEventListener('DOMContentLoaded', () => {
  new AIgncChatbot();
});
