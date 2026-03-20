/** Web shim for react-native-sound */
class Sound {
  constructor(filename, basePath, onError) {
    this._audio = null;
    if (typeof window !== 'undefined') {
      try {
        this._audio = new window.Audio(filename);
      } catch (e) { /* ignore */ }
    }
    if (onError) setTimeout(() => onError(null), 0);
  }

  play(onEnd) {
    if (this._audio) {
      this._audio.play().then(() => {
        if (onEnd) this._audio.onended = () => onEnd(true);
      }).catch(() => { if (onEnd) onEnd(false); });
    } else if (onEnd) { onEnd(false); }
    return this;
  }

  stop() { if (this._audio) { this._audio.pause(); this._audio.currentTime = 0; } return this; }
  pause() { if (this._audio) this._audio.pause(); return this; }
  release() { this._audio = null; return this; }
  setVolume(value) { if (this._audio) this._audio.volume = value; return this; }
  setNumberOfLoops(loops) { if (this._audio) this._audio.loop = loops === -1; return this; }
  setSpeed() { return this; }
  setCurrentTime(time) { if (this._audio) this._audio.currentTime = time; return this; }
  getCurrentTime(cb) { if (cb) cb(this._audio?.currentTime || 0, false); }
  getDuration() { return this._audio?.duration || 0; }
  isPlaying() { return this._audio ? !this._audio.paused : false; }
  isLoaded() { return !!this._audio; }

  static setCategory() {}
  static setMode() {}
  static setActive() {}
  static enable() {}
}

export default Sound;
