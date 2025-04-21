// Brown Noise Generator
class BrownNoisePlayer {
    constructor() {
        this.initialized = false;
        this.playing = false;
        this.volume = 0.5; // Default volume (0-1)
        this.audioContext = null;
        this.noiseNode = null;
        this.gainNode = null;
        
        // DOM elements
        this.toggleBtn = document.getElementById('toggle-noise-btn');
        this.volumeSlider = document.getElementById('noise-volume');
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Load state from localStorage
        this.loadState();
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Toggle noise on/off
        this.toggleBtn.addEventListener('click', () => {
            if (this.playing) {
                this.stop();
            } else {
                this.start();
            }
        });
        
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
            localStorage.setItem('brownNoiseVolume', e.target.value);
        });
    }
    
    // Initialize audio context and nodes
    initialize() {
        if (this.initialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.volume;
            this.gainNode.connect(this.audioContext.destination);
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    
    // Generate brown noise
    createBrownNoise() {
        // Create buffer for brown noise
        const bufferSize = 10 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(
            1, // mono
            bufferSize,
            this.audioContext.sampleRate
        );
        
        // Fill the buffer with brown noise
        const data = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            // Brown noise algorithm
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; // Adjust volume to make it more audible
        }
        
        // Create buffer source node
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        // Connect to gain node
        noiseSource.connect(this.gainNode);
        
        return noiseSource;
    }
    
    // Start playing brown noise
    start() {
        if (!this.initialized) {
            this.initialize();
        }
        
        if (this.playing) return;
        
        // Create and start noise source
        this.noiseNode = this.createBrownNoise();
        this.noiseNode.start();
        this.playing = true;
        
        // Update UI
        this.toggleBtn.classList.add('active');
        this.toggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        
        // Save state
        localStorage.setItem('brownNoisePlaying', 'true');
    }
    
    // Stop playing brown noise
    stop() {
        if (!this.playing || !this.noiseNode) return;
        
        // Stop and disconnect noise source
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
        this.playing = false;
        
        // Update UI
        this.toggleBtn.classList.remove('active');
        this.toggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        
        // Save state
        localStorage.setItem('brownNoisePlaying', 'false');
    }
    
    // Set volume
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value)); // Clamp between 0-1
        
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        
        // Update the background gradient of the volume slider
        const percent = this.volume * 100;
        this.volumeSlider.style.background = `linear-gradient(90deg, var(--primary-color) ${percent}%, var(--gray-light) ${percent}%)`;
        
        // In dark mode, use different colors
        if (document.body.classList.contains('dark-mode')) {
            this.volumeSlider.style.background = `linear-gradient(90deg, var(--dark-primary) ${percent}%, var(--dark-surface-2) ${percent}%)`;
        }
    }
    
    // Load saved state from localStorage
    loadState() {
        // Load volume
        const savedVolume = localStorage.getItem('brownNoiseVolume');
        if (savedVolume !== null) {
            this.volumeSlider.value = savedVolume;
            this.setVolume(savedVolume / 100);
        }
        
        // Load playing state
        const wasPlaying = localStorage.getItem('brownNoisePlaying') === 'true';
        if (wasPlaying) {
            // Start with a small delay to ensure the page is fully loaded
            setTimeout(() => this.start(), 1000);
        }
    }
}

// Initialize the brown noise player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.brownNoisePlayer = new BrownNoisePlayer();
});

// Update volume slider background when theme changes
document.getElementById('toggle-theme-btn')?.addEventListener('click', () => {
    setTimeout(() => {
        if (window.brownNoisePlayer) {
            window.brownNoisePlayer.setVolume(window.brownNoisePlayer.volume);
        }
    }, 100);
});
