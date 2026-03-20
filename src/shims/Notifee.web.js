/**
 * Web shim for @notifee/react-native
 * Uses browser Notification API when available, otherwise silent no-op.
 * Preserves the same API shape so existing hooks (useChefSocket) work unchanged.
 */

const notifee = {
  displayNotification: async ({ title, body, android, ios }) => {
    // Use browser Notification API if available and permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
    return 'web-notification-id';
  },

  cancelNotification: async (_id) => {},
  cancelAllNotifications: async () => {},
  cancelDisplayedNotifications: async () => {},

  createChannel: async (_channel) => _channel?.id || 'default',
  deleteChannel: async (_channelId) => {},
  getChannels: async () => [],

  requestPermission: async () => ({
    authorizationStatus: 1, // AUTHORIZED
  }),

  getNotificationSettings: async () => ({
    authorizationStatus: 1,
  }),

  setBadgeCount: async (_count) => {},
  getBadgeCount: async () => 0,
  incrementBadgeCount: async (_incrementBy) => {},
  decrementBadgeCount: async (_decrementBy) => {},

  onForegroundEvent: (_callback) => {
    // Return unsubscribe function
    return () => {};
  },

  onBackgroundEvent: (_callback) => {},

  createTriggerNotification: async (_notification, _trigger) => 'web-trigger-id',
  cancelTriggerNotifications: async () => {},
  getTriggerNotificationIds: async () => [],
};

// Android channel importance constants
export const AndroidImportance = {
  DEFAULT: 3,
  HIGH: 4,
  LOW: 2,
  MIN: 1,
  NONE: 0,
};

// iOS foreground presentation options
export const IOSNotificationPresentationOption = {
  ALERT: 'alert',
  BADGE: 'badge',
  SOUND: 'sound',
};

// Event types
export const EventType = {
  DISMISSED: 0,
  PRESS: 1,
  ACTION_PRESS: 2,
  DELIVERED: 3,
  APP_BLOCKED: 4,
  CHANNEL_BLOCKED: 5,
  CHANNEL_GROUP_BLOCKED: 6,
  TRIGGER_NOTIFICATION_CREATED: 7,
};

// Authorization status
export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

export default notifee;
