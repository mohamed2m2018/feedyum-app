/**
 * BackgroundAlarmService - Handles alarm when app is in background or closed
 * 
 * Uses @notifee/react-native to:
 * 1. Create a high-priority notification channel with custom alarm sound
 * 2. Display persistent ongoing notification with alarm sound
 * 3. Stop the alarm when chef interacts
 * 
 * The notification channel handles the sound playback natively.
 * When app is open, OrderAlarmService handles the looping in-app alarm.
 */
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  EventType,
} from '@notifee/react-native';
import { Platform, AppState } from 'react-native';
import OrderAlarmService from './OrderAlarmService';

const CHANNEL_ID = 'order_alarm_channel';
const CHANNEL_NAME_EN = 'Order Alerts';

class BackgroundAlarmService {
  constructor() {
    this.initialized = false;
    this.alarmInterval = null;
  }

  /**
   * Initialize notification channels - call on app startup
   */
  async initialize() {
    if (this.initialized || Platform.OS !== 'android') return;

    try {
      // Create high-priority notification channel with custom alarm sound
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME_EN,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'alarm_ringtone', // References android/app/src/main/res/raw/alarm_ringtone.mp3
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        bypassDnd: true, // Bypass Do Not Disturb
      });

      console.log('[BackgroundAlarm] Notification channel created');

      // Listen for notification events (foreground)
      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          // Chef tapped the notification — stop the alarm
          this.stopForegroundAlarm();
          OrderAlarmService.stopAlarm();
        }
        if (type === EventType.DISMISSED) {
          this.stopForegroundAlarm();
          OrderAlarmService.stopAlarm();
        }
      });

      // Listen for app coming to foreground to stop background alarm
      this._appStateSubscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          // App came to foreground — stop the background alarm
          // (in-app alarm will be handled by OrderAlarmService via socket)
          this.stopForegroundAlarm();
        }
      });

      this.initialized = true;
      console.log('[BackgroundAlarm] Initialized successfully');
    } catch (error) {
      console.error('[BackgroundAlarm] Init error:', error);
    }
  }

  /**
   * Show a persistent alarm notification with repeating sound.
   * The notification is re-displayed every 15 seconds to re-trigger the sound,
   * creating a looping alarm effect without needing a foreground service.
   */
  async showAlarmNotification() {
    if (Platform.OS !== 'android') return;

    try {
      // Clear any existing alarm interval before starting a new one
      // Prevents overlapping loops when multiple notifications arrive
      if (this.alarmInterval) {
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }

      // Display the notification (this triggers the channel sound)
      await this._displayAlarmNotification();

      // Re-display every 15 seconds to re-trigger the alarm sound
      // This creates a looping effect — each re-display plays the sound again
      this.alarmInterval = setInterval(async () => {
        try {
          await this._displayAlarmNotification();
          console.log('[BackgroundAlarm] Re-triggered alarm notification');
        } catch (err) {
          console.error('[BackgroundAlarm] Re-trigger error:', err);
        }
      }, 15000);

      console.log('[BackgroundAlarm] Alarm notification shown with repeat');
    } catch (error) {
      console.error('[BackgroundAlarm] Failed to show notification:', error);
    }
  }

  /**
   * Display the actual notification
   */
  async _displayAlarmNotification() {
    await notifee.displayNotification({
      id: 'order_alarm',
      title: '🔔 New Order!',
      body: 'You have a new order. Tap to view.',
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        sound: 'alarm_ringtone',
        vibrationPattern: [300, 500, 300, 500],
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        // Auto-dismiss on tap so the notification doesn't stick
        ongoing: false,
        autoCancel: true,
      },
    });
  }

  /**
   * Stop the alarm notification and clear the repeat interval
   */
  async stopForegroundAlarm() {
    try {
      // Clear the repeat interval
      if (this.alarmInterval) {
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }

      await notifee.cancelNotification('order_alarm');
      console.log('[BackgroundAlarm] Alarm notification cancelled');
    } catch (error) {
      console.error('[BackgroundAlarm] Failed to cancel notification:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
    }
  }
}

console.log('[BackgroundAlarm] Module loaded');

// Register background event handler (runs even when app is killed)
try {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('[BackgroundAlarm] Background event:', type, detail.notification?.id);

    if (type === EventType.PRESS) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
    }

    if (type === EventType.DISMISSED) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
    }
  });
} catch (e) {
  console.error('[BackgroundAlarm] Failed to register background handler:', e);
}

// Singleton
export default new BackgroundAlarmService();
