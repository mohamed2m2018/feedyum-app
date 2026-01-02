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
      // OneSignal Initialization (v5)
      OneSignal.initialize(oneSignalAppId);
      
      // Level 6 = VERBOSE, 0 = NONE
      OneSignal.Debug.setLogLevel(6);

      // Request permission immediately or deferred? 
      // Existing code did promptForPushNotificationsWithUserResponse
      OneSignal.Notifications.requestPermission(true).then((response) => {
});

      // Setup notification handlers
      this.setupNotificationHandlers();
      
      NotificationService.isInitialized = true;
');
    } catch (error) {
}
  }

  setupNotificationHandlers() {
    // Handle notification received while app is open (Foreground)
    // v5: 'foregroundWillDisplay'
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
const notification = event.getNotification();
const data = notification.additionalData;
// In v5, to show the notification, you just don't preventDefault.
      // Or explicitly event.getNotification().display() if you intercepted it?
      // "If you want to display the notification, call event.getNotification().display()" is v4 style completion?
      // v5 documentation says: "The notification will display unless you call event.preventDefault()"
      // So detailed logging is fine, then let it show.
    });

    // Handle notification opened/tapped (Click)
    // v5: 'click'
    OneSignal.Notifications.addEventListener('click', (event) => {
const notification = event.notification;
      
      const data = notification.additionalData;
      if (data) {
        this.handleNotificationTap(data);
      }
    });

    // Handle in-app message actions
    // v5: 'click' event on InAppMessages namespace
    OneSignal.InAppMessages.addEventListener('click', (event) => {
});
  }

  // Handle notification tap with deep linking
  handleNotificationTap(data) {
// Use deep linking service to navigate
    const deepLinkingService = DeepLinkingService.getInstance();
    deepLinkingService.handleNotificationTap(data);
  }

  // Set user ID for targeting notifications
  // v5: OneSignal.login("externalId")
  async setUserId(userId) {
    try {
      OneSignal.login(userId.toString());
      await AsyncStorage.setItem('onesignal_user_id', userId.toString());
:', userId);
    } catch (error) {
}
  }

  // Remove user ID (logout)
  // v5: OneSignal.logout()
  async removeUserId() {
    try {
      OneSignal.logout();
      await AsyncStorage.removeItem('onesignal_user_id');
');
    } catch (error) {
}
  }

  // Get device push token
  // v5: OneSignal.User.pushSubscription.getPushSubscriptionId() / getToken()
  async getDeviceState() {
    try {
        // This is tricky mapping. v4 getDeviceState returned { userId, pushToken, ... }
        // v5 separates these.
        const id = OneSignal.User.pushSubscription.getId();
        const token = OneSignal.User.pushSubscription.getToken();
        const optedIn = OneSignal.User.pushSubscription.getOptedIn();
        
        return {
            userId: id,
            pushToken: token,
            isSubscribed: optedIn,
            hasNotificationPermission: OneSignal.Notifications.hasPermission()
        };
    } catch (error) {
return null;
    }
  }

  // Send tag for user segmentation
  // v5: OneSignal.User.addTag(key, value)
  async sendTag(key, value) {
    try {
      OneSignal.User.addTag(key, value);
} catch (error) {
}
  }

  // Send multiple tags
  // v5: OneSignal.User.addTags(tagsObject)
  async sendTags(tags) {
    try {
      OneSignal.User.addTags(tags);
} catch (error) {
}
  }

  // Delete tags
  // v5: OneSignal.User.removeTags(keysArray)
  async deleteTags(tags) {
    try {
      OneSignal.User.removeTags(tags);
} catch (error) {
}
  }

  // Check notification permission status
  async getNotificationPermissionStatus() {
    try {
      return OneSignal.Notifications.hasPermission();
    } catch (error) {
return false;
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    try {
      const response = await OneSignal.Notifications.requestPermission(true);
      return response;
    } catch (error) {
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
      user_type: user.type || 'user',
      user_id: user._id.toString(),
      language: user.language || 'en',
      location_city: user.location?.city || '',
      location_country: user.location?.country || '',
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
}
  }
}

export default NotificationService; 