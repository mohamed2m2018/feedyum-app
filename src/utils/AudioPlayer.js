class AudioPlayer {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.listeners = new Map();
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Play audio file
  async play(audioPath) {
    try {
      // Stop current audio if playing different audio
      if (this.isPlaying && this.currentAudio !== audioPath) {
        this.stop();
      }

      this.currentAudio = audioPath;
      this.isPlaying = true;

      console.log('Playing audio:', audioPath);
      this.emit('play', { audioPath });

      return true;
    } catch (error) {
      console.error('Audio play error:', error);
      this.emit('error', error);
      return false;
    }
  }

  // Stop audio
  stop() {
    const stoppedAudio = this.currentAudio;
    
    this.isPlaying = false;
    this.currentAudio = null;

    if (stoppedAudio) {
      this.emit('stop', { audioPath: stoppedAudio });
    }
  }

  // Get current status
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentAudio: this.currentAudio,
    };
  }

  // Format time for display
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Clean up resources
  cleanup() {
    this.stop();
    this.listeners.clear();
  }
}

// Create singleton instance
const audioPlayer = new AudioPlayer();

export default audioPlayer;
