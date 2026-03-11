/**
 * OrderAlarmService - Persistent alarm for new orders
 * 
 * Plays a loud looping ringtone + vibration pattern when a new order arrives.
 * The alarm persists until the chef explicitly acknowledges it.
 * 
 * FOREGROUND ONLY: For background/closed app, relies on OneSignal push
 * notifications with custom sound configured on the backend.
 */
import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';

class OrderAlarmService {
  constructor() {
    this.sound = null;
    this.isAlarmActive = false;
    this.vibrationInterval = null;
    this.listeners = [];
  }

  /**
   * Subscribe to alarm state changes
   * @param {Function} callback - Called with (isActive: boolean)
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.isAlarmActive);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /** Notify all listeners of state change */
  _notifyListeners() {
    this.listeners.forEach(cb => cb(this.isAlarmActive));
  }

  /**
   * Start the persistent alarm (looping sound + vibration)
   */
  async startAlarm() {
    // Don't double-start
    if (this.isAlarmActive) {
      console.log('[OrderAlarm] Alarm already active, skipping');
      return;
    }

    try {
      console.log('[OrderAlarm] Starting alarm...');
      this.isAlarmActive = true;

      // Configure audio to play even in silent mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Load and play the ringtone on loop
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/ringtone.mp3'),
        {
          isLooping: true,
          volume: 1.0,
          shouldPlay: true,
        }
      );
      this.sound = sound;

      // Start repeating vibration pattern
      // Pattern: vibrate 800ms, pause 400ms, vibrate 800ms, pause 1000ms (repeat)
      const vibrationPattern = [0, 800, 400, 800, 1000];
      if (Platform.OS === 'android') {
        // Android supports repeat parameter
        Vibration.vibrate(vibrationPattern, true);
      } else {
        // iOS: manually repeat vibration since iOS doesn't support repeat flag
        Vibration.vibrate(vibrationPattern);
        this.vibrationInterval = setInterval(() => {
          if (this.isAlarmActive) {
            Vibration.vibrate(vibrationPattern);
          }
        }, 3000); // Repeat every 3 seconds (total pattern duration)
      }

      console.log('[OrderAlarm] Alarm started successfully');
      this._notifyListeners();
    } catch (error) {
      console.error('[OrderAlarm] Failed to start alarm:', error);
      this.isAlarmActive = false;
      this._notifyListeners();
    }
  }

  /**
   * Stop the alarm (sound + vibration)
   */
  async stopAlarm() {
    if (!this.isAlarmActive) return;

    try {
      console.log('[OrderAlarm] Stopping alarm...');
      this.isAlarmActive = false;

      // Stop vibration
      Vibration.cancel();
      if (this.vibrationInterval) {
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }

      // Stop and unload sound
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      console.log('[OrderAlarm] Alarm stopped');
      this._notifyListeners();
    } catch (error) {
      console.error('[OrderAlarm] Error stopping alarm:', error);
      // Force cleanup
      this.sound = null;
      this.isAlarmActive = false;
      this._notifyListeners();
    }
  }

  /**
   * Check if alarm is currently playing
   */
  isPlaying() {
    return this.isAlarmActive;
  }
}

// Singleton instance
export default new OrderAlarmService();
