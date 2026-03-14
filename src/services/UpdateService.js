/**
 * UpdateService - Programmatic OTA update checking
 * 
 * Checks for updates when the app comes to foreground.
 * If an update is found, downloads it silently.
 * The update is applied automatically on the NEXT cold start.
 * 
 * No sudden restarts — zero UX disruption.
 * Works only in production builds (not in __DEV__ mode).
 */
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';

class UpdateService {
  constructor() {
    this._appStateSubscription = null;
    this._checking = false; // Prevent concurrent checks
  }

  /**
   * Initialize the service — call once on app startup
   */
  initialize() {
    if (__DEV__) return;

    // Check when app comes to foreground from background
    this._appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        this._checkAndDownload();
      }
    });

    // Also check on startup (supplements the built-in ON_LOAD check)
    this._checkAndDownload();
  }

  /**
   * Check for update and download silently (no restart).
   * The downloaded update will load on the next cold start.
   */
  async _checkAndDownload() {
    if (this._checking) return;
    this._checking = true;

    try {
      const check = await Updates.checkForUpdateAsync();

      if (check.isAvailable) {
        console.log('[UpdateService] Update available — downloading silently...');
        const result = await Updates.fetchUpdateAsync();
        if (result.isNew) {
          console.log('[UpdateService] Update downloaded. Will apply on next app launch.');
        }
      }
    } catch (error) {
      // Silently fail — don't disrupt the user
      console.error('[UpdateService] Check failed:', error?.message);
    } finally {
      this._checking = false;
    }
  }

  destroy() {
    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
    }
  }
}

export default new UpdateService();
