import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import NotificationService from './NotificationService';
import DeepLinkingService from './DeepLinkingService';

class AppInitializer {
  static isInitialized = false;

  static async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing FoodTok app services...');

      // Initialize deep linking service
      const deepLinkingService = DeepLinkingService.getInstance();
      
      // Initialize notification service
      const notificationService = NotificationService.getInstance();
      await notificationService.initialize(process.env.ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID');

      // Check for deferred deep links (for users who just installed the app)
      await this.handleDeferredDeepLinks();

      // Restore user session and notification data
      await this.restoreUserNotificationData();

      this.isInitialized = true;
      console.log('FoodTok app initialization complete');

    } catch (error) {
      console.error('App initialization error:', error);
    }
  }

  static async handleDeferredDeepLinks() {
    try {
      console.log('Checking for deferred deep links...');

      // Check for deferred deep link data stored by web fallback
      const deferredLinkData = await AsyncStorage.getItem('foodtok_deferred_link');
      const deferredToken = await AsyncStorage.getItem('foodtok_deferred_token');

      if (deferredLinkData) {
        console.log('Found deferred deep link data');
        
        const linkData = JSON.parse(deferredLinkData);
        const currentTime = Date.now();
        const linkAge = currentTime - (linkData.timestamp || 0);
        
        // Only process deferred links that are less than 24 hours old
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (linkAge < maxAge) {
          console.log('Processing deferred deep link:', linkData);
          
          // Wait a bit for the app to fully initialize
          setTimeout(() => {
            this.processDeferredLink(linkData);
          }, 2000);

          // Track deferred deep link success
          this.trackDeferredLinkOpened(linkData);
        } else {
          console.log('Deferred deep link expired, ignoring');
        }

        // Clean up stored deferred link data
        await AsyncStorage.removeItem('foodtok_deferred_link');
        await AsyncStorage.removeItem('foodtok_deferred_token');
      } else {
        console.log('No deferred deep links found');
      }
    } catch (error) {
      console.error('Error handling deferred deep links:', error);
    }
  }

  static processDeferredLink(linkData) {
    try {
      const { type, contentId, deepLink } = linkData;
      
      console.log(`Processing deferred ${type} link for content ${contentId}`);
      
      // Use the deep linking service to handle the link
      const deepLinkingService = DeepLinkingService.getInstance();
      
      if (deepLink) {
        // Process the full deep link
        deepLinkingService.handleDeepLink(deepLink);
      } else {
        // Fallback: use type and contentId to navigate
        const parsedLink = {
          type,
          id: contentId,
          params: linkData
        };
        deepLinkingService.navigateToScreen(parsedLink);
      }

      // Show a welcome message for deferred links
      this.showDeferredLinkWelcome(type, contentId);

    } catch (error) {
      console.error('Error processing deferred link:', error);
    }
  }

  static showDeferredLinkWelcome(type, contentId) {
    // Optional: Show a welcome toast or modal for users who just installed the app
    const messages = {
      reel: 'Welcome to FoodTok! Check out this amazing recipe 🍽️',
      profile: 'Welcome to FoodTok! Discover this food creator 👨‍🍳',
      chefProfile: 'Welcome to FoodTok! Meet this talented chef 👨‍🍳',
      chefMenu: 'Welcome to FoodTok! Browse this delicious menu 📋',
      menu: 'Welcome to FoodTok! Explore this menu 🍽️',
      dish: 'Welcome to FoodTok! Check out this recipe 🍝',
      live: 'Welcome to FoodTok! Join this live session 🔴'
    };

    const message = messages[type] || 'Welcome to FoodTok! 🎉';
    
    // You can implement a toast or modal here
    console.log('Deferred link welcome:', message);
    
    // Example with react-native-toast-message (if installed)
    // Toast.show({
    //   type: 'success',
    //   text1: 'Welcome to FoodTok! 🎉',
    //   text2: message,
    //   visibilityTime: 4000
    // });
  }

  static trackDeferredLinkOpened(linkData) {
    try {
      // Track analytics for deferred deep link success
      const analyticsData = {
        event: 'deferred_deep_link_opened',
        content_type: linkData.type,
        content_id: linkData.contentId,
        link_age: Date.now() - (linkData.timestamp || 0),
        platform: Platform.OS,
        app_name: 'FoodTok',
        timestamp: new Date().toISOString()
      };

      console.log('Tracking deferred link analytics:', analyticsData);

      // Send to your analytics service
      // Analytics.track('deferred_deep_link_opened', analyticsData);
      
      // Send to backend analytics
      // fetch('/api/analytics/deferred-link-opened', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(analyticsData)
      // }).catch(console.error);

    } catch (error) {
      console.error('Error tracking deferred link:', error);
    }
  }

  static async restoreUserNotificationData() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const authToken = await AsyncStorage.getItem('auth_token');

      if (userData && authToken) {
        const user = JSON.parse(userData);
        console.log('Restoring user notification data for:', user.fullName);
        
        // Restore user ID and tags for notifications
        const notificationService = NotificationService.getInstance();
        await notificationService.setUserId(user._id);
        await notificationService.updateUserTags(user);
      }
    } catch (error) {
      console.error('Error restoring user notification data:', error);
    }
  }

  static async handleUserLogin(userData, authToken) {
    try {
      console.log('Setting up notifications for user login:', userData.fullName);

      // Store user data
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('auth_token', authToken);

      // Set up notifications
      const notificationService = NotificationService.getInstance();
      await notificationService.setUserId(userData._id);
      await notificationService.updateUserTags(userData);

      console.log('User login notification setup complete');
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }

  static async handleUserLogout() {
    try {
      console.log('Cleaning up user data on logout');

      // Clear stored user data
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('auth_token');

      // Clear notification data
      const notificationService = NotificationService.getInstance();
      await notificationService.clearUserData();

      console.log('User logout cleanup complete');
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  }

  static async handleUserProfileUpdate(userData) {
    try {
      console.log('Updating user notification data:', userData.fullName);

      // Update stored user data
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));

      // Update notification tags
      const notificationService = NotificationService.getInstance();
      await notificationService.updateUserTags(userData);

      console.log('User profile update complete');
    } catch (error) {
      console.error('Error handling user profile update:', error);
    }
  }

  static async testNotification() {
    try {
      const notificationService = NotificationService.getInstance();
      const deviceState = await notificationService.getDeviceState();
      
      console.log('Notification test results:', {
        hasPermission: deviceState.hasNotificationPermission,
        userId: deviceState.userId,
        pushToken: deviceState.pushToken ? 'Present' : 'Missing'
      });

      return deviceState;
    } catch (error) {
      console.error('Error testing notifications:', error);
      return null;
    }
  }

  static generateShareLink(type, id, params = {}) {
    return DeepLinkingService.generateShareableLink(type, id, params);
  }

  static handleNotificationOpen(notificationData) {
    console.log('Handling notification open:', notificationData);
    
    const deepLinkingService = DeepLinkingService.getInstance();
    deepLinkingService.handleNotificationTap(notificationData);
  }

  // Enhanced sharing for deferred deep links
  static async generateDeferredShareLink(type, contentId, customParams = {}) {
    try {
      // Generate the standard share links
      const shareLinks = DeepLinkingService.generateShareableLink(type, contentId, customParams);
      
      // The universal link will automatically handle the deferred deep link flow
      // via the web fallback page when users don't have the app installed
      
      return {
        ...shareLinks,
        // Add deferred deep link specific data
        deferredSupported: true,
        installPrompt: true,
        webFallbackUrl: shareLinks.universalLink
      };
    } catch (error) {
      console.error('Error generating deferred share link:', error);
      throw error;
    }
  }

  // Handle app state changes for deferred linking
  static handleAppStateChange(nextAppState) {
    if (nextAppState === 'active') {
      // App became active, check for any pending deferred links
      // This is useful if the app was already installed but not opened
      this.handleDeferredDeepLinks();
    }
  }

  // Utility to check if this is likely a fresh install
  static async isLikelyFreshInstall() {
    try {
      const hasUserData = await AsyncStorage.getItem('user_data');
      const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_onboarding');
      const installTimestamp = await AsyncStorage.getItem('install_timestamp');
      
      // If no install timestamp, set it now
      if (!installTimestamp) {
        await AsyncStorage.setItem('install_timestamp', Date.now().toString());
        return true;
      }
      
      // Consider it fresh if no user data and install was recent (< 1 hour)
      const installAge = Date.now() - parseInt(installTimestamp);
      const isRecent = installAge < (60 * 60 * 1000); // 1 hour
      
      return !hasUserData && !hasSeenOnboarding && isRecent;
    } catch (error) {
      console.error('Error checking fresh install:', error);
      return false;
    }
  }

  // Mark onboarding as completed
  static async markOnboardingComplete() {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  }
}

export default AppInitializer; 