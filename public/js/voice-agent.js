/**
 * The AIgnc - Voice Agent (ElevenLabs Integration)
 */

class VoiceAgent {
  constructor() {
    this.modal = document.getElementById('voiceModal');
    this.openBtn = document.getElementById('voiceAgentBtn');
    this.closeBtn = document.getElementById('voiceModalClose');
    this.callBtn = document.getElementById('voiceCallBtn');
    this.status = document.getElementById('voiceStatus');

    this.isCallActive = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;

    this.init();
  }

  init() {
    this.openBtn.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.callBtn.addEventListener('click', () => this.toggleCall());

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }

  open() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this.isCallActive) {
      this.endCall();
    }
    this.modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  async toggleCall() {
    if (this.isCallActive) {
      this.endCall();
    } else {
      await this.startCall();
    }
  }

  async startCall() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.isCallActive = true;
      this.updateUI('listening');

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Setup media recorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        await this.processAudio(audioBlob);
      };

      // Start recording in intervals
      this.startRecording();

    } catch (err) {
      console.error('Microphone access error:', err);
      this.updateUI('error', 'Microphone access denied. Please allow microphone access.');
    }
  }

  startRecording() {
    if (!this.isCallActive || !this.mediaRecorder) return;

    this.audioChunks = [];
    this.mediaRecorder.start();

    // Stop recording after 5 seconds to process
    setTimeout(() => {
      if (this.isCallActive && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }, 5000);
  }

  async processAudio(audioBlob) {
    if (!this.isCallActive) return;

    this.updateUI('processing');

    try {
      // In production, send to ElevenLabs API
      // For demo, we'll simulate a response

      // Check if ElevenLabs API key is configured
      const hasApiKey = false; // Set to true when API key is configured

      if (hasApiKey) {
        // Real ElevenLabs integration would go here
        // const response = await this.callElevenLabsAPI(audioBlob);
        // await this.playResponse(response);
      } else {
        // Demo mode - play a pre-recorded message or text-to-speech
        await this.playDemoResponse();
      }

      // Continue listening
      if (this.isCallActive) {
        this.updateUI('listening');
        this.startRecording();
      }

    } catch (err) {
      console.error('Processing error:', err);
      this.updateUI('error', 'Error processing audio. Please try again.');
    }
  }

  async playDemoResponse() {
    // Use Web Speech API for demo
    const responses = [
      "Hello! Thank you for calling The AIgnc. I'm your AI assistant. How can I help you today with workflow automation?",
      "We specialize in AI-powered automation for businesses. Our retainer packages start at $2,500 per month.",
      "Would you like to schedule a discovery call with our team? You can also reach us on WhatsApp at +971 55 468 6700."
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    // Check if speech synthesis is available
    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Try to find a good voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
          v.name.includes('Google') || v.name.includes('Microsoft') || v.lang.startsWith('en')
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = resolve;
        utterance.onerror = resolve;

        this.updateUI('speaking');
        speechSynthesis.speak(utterance);
      });
    }
  }

  endCall() {
    this.isCallActive = false;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    // Stop all tracks
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Cancel any speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    this.updateUI('idle');
  }

  updateUI(state, message = null) {
    const btn = this.callBtn;
    const status = this.status;

    switch (state) {
      case 'idle':
        btn.innerHTML = '<i class="fas fa-microphone"></i><span>Start Call</span>';
        btn.style.background = 'var(--gradient-accent)';
        status.textContent = 'Click the button to start talking';
        break;

      case 'listening':
        btn.innerHTML = '<i class="fas fa-stop"></i><span>End Call</span>';
        btn.style.background = '#EF4444';
        status.textContent = 'Listening... Speak now';
        break;

      case 'processing':
        status.textContent = 'Processing your message...';
        break;

      case 'speaking':
        status.textContent = 'AI is responding...';
        break;

      case 'error':
        btn.innerHTML = '<i class="fas fa-microphone"></i><span>Try Again</span>';
        btn.style.background = 'var(--gradient-accent)';
        status.textContent = message || 'An error occurred';
        break;
    }
  }
}

// Initialize voice agent
document.addEventListener('DOMContentLoaded', () => {
  // Load voices
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }

  new VoiceAgent();
});
