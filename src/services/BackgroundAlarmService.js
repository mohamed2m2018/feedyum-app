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
import DeepLinkingService from './DeepLinkingService';

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
          console.log('[BackgroundAlarm] Notification PRESSED — stopping alarm, orderId:', detail?.notification?.data?.orderId);
          // Chef tapped the notification — stop the alarm
          this.stopForegroundAlarm();
          OrderAlarmService.stopAlarm();

          // Navigate to order details if orderId is available
          const orderId = detail?.notification?.data?.orderId;
          if (orderId) {
            try {
              const deepLink = DeepLinkingService.getInstance();
              deepLink.navigateToChefOrderDetails(orderId);
            } catch (navError) {
              console.warn('[BackgroundAlarm] Navigation failed:', navError?.message);
            }
          }
        }
        if (type === EventType.DISMISSED) {
          console.log('[BackgroundAlarm] Notification DISMISSED — stopping alarm');
          this.stopForegroundAlarm();
          OrderAlarmService.stopAlarm();
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
  async showAlarmNotification(alarmType = 'newOrder', notificationData = {}) {
    if (Platform.OS !== 'android') return;

    try {
      // Clear any existing alarm interval before starting a new one
      // Prevents overlapping loops when multiple notifications arrive
      if (this.alarmInterval) {
        console.log('[BackgroundAlarm] Clearing existing alarm interval before new one');
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }

      // Store notification data for use in display
      this._currentNotificationData = notificationData;

      // Display the notification (this triggers the channel sound)
      await this._displayAlarmNotification(alarmType, notificationData);

      // Re-display every 15 seconds to re-trigger the alarm sound
      // This creates a looping effect — each re-display plays the sound again
      this.alarmInterval = setInterval(async () => {
        try {
          await this._displayAlarmNotification(alarmType, notificationData);
          console.log('[BackgroundAlarm] Re-triggered alarm notification');
        } catch (err) {
          console.error('[BackgroundAlarm] Re-trigger error:', err);
        }
      }, 15000);
      // Store on global as safety net for hot reload (interval ID survives module re-evaluation)
      global.__backgroundAlarmIntervalId = this.alarmInterval;

      console.log('[BackgroundAlarm] Alarm notification shown with repeat, type:', alarmType, 'orderId:', notificationData.orderId);
    } catch (error) {
      console.error('[BackgroundAlarm] Failed to show notification:', error);
    }
  }

  _getNotificationContent(alarmType) {
    switch (alarmType) {
      case 'orderConfirmed':
        return {
          id: 'order_confirmed_alarm',
          title: '✅ Order Confirmed!',
          body: 'A customer confirmed their order. Tap to view.',
        };
      case 'awaitingConfirmation':
        return {
          id: 'awaiting_confirmation_alarm',
          title: '⏳ Confirm Your Order!',
          body: 'Your order is waiting for your confirmation. Tap to review.',
        };
      case 'newOrder':
      default:
        return {
          id: 'order_alarm',
          title: '🔔 New Order!',
          body: 'You have a new order. Tap to view.',
        };
    }
  }

  /**
   * Display the actual notification with correct content per alarm type
   */
  async _displayAlarmNotification(alarmType = 'newOrder', notificationData = {}) {
    const content = this._getNotificationContent(alarmType);
    await notifee.displayNotification({
      id: content.id,
      title: content.title,
      body: content.body,
      data: { orderId: notificationData.orderId || '', alarmType },
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
   * Stop the alarm notification and clear the repeat interval.
   * Called from: notifee press/dismiss, toast click, OneSignal click, OrderManagement focus.
   */
  async stopForegroundAlarm() {
    try {
      // Clear the repeat interval (instance reference)
      if (this.alarmInterval) {
        console.log('[BackgroundAlarm] Clearing active alarm interval');
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }
      // Also clear global safety net interval (handles hot reload orphans)
      if (global.__backgroundAlarmIntervalId) {
        clearInterval(global.__backgroundAlarmIntervalId);
        global.__backgroundAlarmIntervalId = null;
      }

      // Cancel all possible alarm notification IDs
      await notifee.cancelNotification('order_alarm');
      await notifee.cancelNotification('order_confirmed_alarm');
      await notifee.cancelNotification('awaiting_confirmation_alarm');
      console.log('[BackgroundAlarm] All alarm notifications cancelled');
    } catch (error) {
      console.error('[BackgroundAlarm] Failed to cancel notification:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}

console.log('[BackgroundAlarm] Module loaded');

// Clean up previous instance on hot reload — prevents orphaned setInterval
if (global.__backgroundAlarmCleanup) {
  console.log('[BackgroundAlarm] Hot reload detected — cleaning up previous instance');
  global.__backgroundAlarmCleanup();
}

// Also clear any orphaned interval ID stored on global (safety net)
if (global.__backgroundAlarmIntervalId) {
  clearInterval(global.__backgroundAlarmIntervalId);
  global.__backgroundAlarmIntervalId = null;
}

// Create the singleton early so background handler can reference it
const backgroundAlarmInstance = new BackgroundAlarmService();

// Store cleanup function for next hot reload
global.__backgroundAlarmCleanup = () => {
  backgroundAlarmInstance.destroy();
};

// Register background event handler (runs even when app is killed)
try {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('[BackgroundAlarm] Background event:', type, detail.notification?.id);

    if (type === EventType.PRESS) {
      // Full stop: clear the 15-second re-trigger interval + cancel all alarm notifications
      await backgroundAlarmInstance.stopForegroundAlarm();
      OrderAlarmService.stopAlarm();

      // Navigate to order details if orderId is available
      const orderId = detail?.notification?.data?.orderId;
      if (orderId) {
        try {
          const deepLink = DeepLinkingService.getInstance();
          deepLink.navigateToChefOrderDetails(orderId);
        } catch (navError) {
          console.warn('[BackgroundAlarm] Background navigation failed:', navError?.message);
        }
      }
    }
    if (type === EventType.DISMISSED) {
      await backgroundAlarmInstance.stopForegroundAlarm();
      OrderAlarmService.stopAlarm();
    }
  });
} catch (e) {
  console.error('[BackgroundAlarm] Failed to register background handler:', e);
}

// Singleton — used by both the background handler above and all consumers
export default backgroundAlarmInstance;
