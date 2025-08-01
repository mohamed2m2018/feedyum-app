import OneSignal from 'react-native-onesignal';
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
      OneSignal.setLogLevel(6, 0);
      OneSignal.setAppId(oneSignalAppId);

      // OneSignal iOS Settings
      OneSignal.promptForPushNotificationsWithUserResponse(response => {
        console.log('Prompt response:', response);
      });

      // Setup notification handlers
      this.setupNotificationHandlers();
      
      NotificationService.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  setupNotificationHandlers() {
    // Handle notification received while app is open
    OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
      console.log('OneSignal: notification will show in foreground:', notificationReceivedEvent);
      
      const notification = notificationReceivedEvent.getNotification();
      console.log('notification: ', notification);
      
      const data = notification.additionalData;
      console.log('additionalData: ', data);

      // Show the notification
      notificationReceivedEvent.complete(notification);
    });

    // Handle notification opened/tapped
    OneSignal.setNotificationOpenedHandler(notification => {
      console.log('OneSignal: notification opened:', notification);
      
      const data = notification.notification.additionalData;
      if (data) {
        this.handleNotificationTap(data);
      }
    });

    // Handle in-app message actions
    OneSignal.setInAppMessageClickHandler(event => {
      console.log('OneSignal IAM clicked:', event);
    });
  }

  // Handle notification tap with deep linking
  handleNotificationTap(data) {
    console.log('Handling notification tap with data:', data);
    
    // Use deep linking service to navigate
    const deepLinkingService = DeepLinkingService.getInstance();
    deepLinkingService.handleNotificationTap(data);
  }

  // Set user ID for targeting notifications
  async setUserId(userId) {
    try {
      OneSignal.setExternalUserId(userId.toString());
      await AsyncStorage.setItem('onesignal_user_id', userId.toString());
      console.log('OneSignal external user ID set:', userId);
    } catch (error) {
      console.error('Error setting OneSignal user ID:', error);
    }
  }

  // Remove user ID (logout)
  async removeUserId() {
    try {
      OneSignal.removeExternalUserId();
      await AsyncStorage.removeItem('onesignal_user_id');
      console.log('OneSignal external user ID removed');
    } catch (error) {
      console.error('Error removing OneSignal user ID:', error);
    }
  }

  // Get device push token
  async getDeviceState() {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState;
    } catch (error) {
      console.error('Error getting device state:', error);
      return null;
    }
  }

  // Send tag for user segmentation
  async sendTag(key, value) {
    try {
      OneSignal.sendTag(key, value);
      console.log(`OneSignal tag sent: ${key} = ${value}`);
    } catch (error) {
      console.error('Error sending OneSignal tag:', error);
    }
  }

  // Send multiple tags
  async sendTags(tags) {
    try {
      OneSignal.sendTags(tags);
      console.log('OneSignal tags sent:', tags);
    } catch (error) {
      console.error('Error sending OneSignal tags:', error);
    }
  }

  // Delete tags
  async deleteTags(tags) {
    try {
      OneSignal.deleteTags(tags);
      console.log('OneSignal tags deleted:', tags);
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
          console.log('Notification permission response:', response);
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
      
      console.log('User notification data cleared');
    } catch (error) {
      console.error('Error clearing user notification data:', error);
    }
  }
}

export default NotificationService; 