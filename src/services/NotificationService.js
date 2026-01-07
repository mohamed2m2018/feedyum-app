import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeepLinkingService from './DeepLinkingService';

class NotificationService {
  static instance = null;
  static isInitialized = false;

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize OneSignal with deep linking
  async initialize(oneSignalAppId) {
    if (NotificationService.isInitialized) return;

    try {
      // OneSignal Initialization
      OneSignal.initialize(oneSignalAppId);

      // Request permission
      OneSignal.Notifications.requestPermission(true);

      // Setup notification handlers
      this.setupNotificationHandlers();

      NotificationService.isInitialized = true;

    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  setupNotificationHandlers() {
    // Check if handlers are already attached to avoid duplication (optional logic could go here)
    // For OneSignal v5, we use OneSignal.Notifications.addEventListener

    // Handle notification clicks
    OneSignal.Notifications.addEventListener('click', (event) => {
      const data = event.notification.additionalData;
      if (data) {
        this.handleNotificationTap(data);
      }
    });

    // Handle foreground notifications
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      // You can prevent default here via event.preventDefault() if needed specific logic
      // For now, allow it to show
    });
  }

  // Handle notification tap with deep linking
  handleNotificationTap(data) {


    // Use deep linking service to navigate
    const deepLinkingService = DeepLinkingService.getInstance();
    deepLinkingService.handleNotificationTap(data);
  }

  // Set user ID for targeting notifications
  async setUserId(userId) {
    try {
      OneSignal.login(userId.toString());
      await AsyncStorage.setItem('onesignal_user_id', userId.toString());

    } catch (error) {
      console.error('Error setting OneSignal user ID:', error);
    }
  }

  // Remove user ID (logout)
  async removeUserId() {
    try {
      OneSignal.logout();
      await AsyncStorage.removeItem('onesignal_user_id');

    } catch (error) {
      console.error('Error removing OneSignal user ID:', error);
    }
  }

  // Get device push token
  async getDeviceState() {
    try {
      const id = OneSignal.User.pushSubscription.getPushSubscriptionId();
      const optedIn = OneSignal.User.pushSubscription.getOptedIn();
      return { pushToken: id, isSubscribed: optedIn };
    } catch (error) {
      console.error('Error getting device state:', error);
      return null;
    }
  }

  // Send tag for user segmentation
  async sendTag(key, value) {
    try {
      OneSignal.User.addTag(key, value);

    } catch (error) {
      console.error('Error sending OneSignal tag:', error);
    }
  }

  // Send multiple tags
  async sendTags(tags) {
    try {
      OneSignal.User.addTags(tags);

    } catch (error) {
      console.error('Error sending OneSignal tags:', error);
    }
  }

  // Delete tags
  async deleteTags(tags) {
    try {
      OneSignal.User.removeTags(tags);

    } catch (error) {
      console.error('Error deleting OneSignal tags:', error);
    }
  }

  // Check notification permission status
  async getNotificationPermissionStatus() {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState?.hasNotificationPermission || false;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    try {
      return new Promise((resolve) => {
        OneSignal.promptForPushNotificationsWithUserResponse(response => {

          resolve(response);
        });
      });
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Handle different notification types
  static createNotificationData(type, id, params = {}) {
    const deepLinkingService = DeepLinkingService.getInstance();
    const deepLink = DeepLinkingService.generateDeepLink(type, id, params);

    return {
      type,
      id,
      deepLink,
      ...params
    };
  }

  // Helper methods for specific notification types
  static createOrderNotificationData(orderId, status, customerName, chefName) {
    return NotificationService.createNotificationData('orderTracking', orderId, {
      status,
      customerName,
      chefName,
      timestamp: Date.now()
    });
  }

  static createChatNotificationData(chatUserId, senderName, message) {
    return NotificationService.createNotificationData('chat', chatUserId, {
      senderName,
      messagePreview: message.substring(0, 50),
      timestamp: Date.now()
    });
  }

  static createChefDashboardNotificationData() {
    return NotificationService.createNotificationData('chefDashboard', null, {
      timestamp: Date.now()
    });
  }

  // Update user tags based on user type and preferences
  async updateUserTags(user) {
    const tags = {
      user_type: String(user.type || 'user'),
      user_id: String(user._id),
      language: String(user.language || 'en'),
      location_city: String(user.location?.city || ''),
      location_country: String(user.location?.country || ''),
      last_active: new Date().toISOString()
    };

    // Add chef-specific tags
    if (user.type === 'chef') {
      tags.is_chef = 'true';
      tags.chef_verified = user.isVerified ? 'true' : 'false';

      if (user.cuisineTypes && user.cuisineTypes.length > 0) {
        tags.cuisine_types = user.cuisineTypes.join(',');
      }
    } else {
      tags.is_chef = 'false';
    }

    await this.sendTags(tags);
  }

  // Clear all user data on logout
  async clearUserData() {
    try {
      await this.removeUserId();

      // Clear relevant tags
      await this.deleteTags([
        'user_type',
        'user_id',
        'is_chef',
        'chef_verified',
        'cuisine_types',
        'location_city',
        'location_country'
      ]);


    } catch (error) {
      console.error('Error clearing user notification data:', error);
    }
  }
}

export default NotificationService; 