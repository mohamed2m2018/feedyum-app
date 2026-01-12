import { Share, Alert, Linking, Platform } from 'react-native';
import DeepLinkingService from '../services/DeepLinkingService';
import request from '../api/request';

class SharingUtils {
  // Generate and share links for different content types
  static async shareContent(type, contentId, customData = {}) {
    try {
      const shareData = await this.generateShareData(type, contentId, customData);

      if (!shareData) {
        throw new Error('Failed to generate share data');
      }

      // Use native sharing with universal link (clickable https)
      const result = await Share.share({
        message: `${shareData.shareText}\n\n${shareData.shareLinks.universalLink}`,
        title: shareData.contentData.title || shareData.contentData.name || 'Check this out!',
      }, {
        // Android specific options
        dialogTitle: 'Share via',
        tintColor: '#FF6B35',
      });

      if (result.action === Share.sharedAction) {


        // Track sharing analytics
        this.trackSharing(type, contentId, result.activityType);

        return { success: true, action: result.action, activityType: result.activityType };
      } else if (result.action === Share.dismissedAction) {
        return { success: false, action: 'dismissed' };
      }
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert(strings.sharingError, strings.failedToShare);
      return { success: false, error: error.message };
    }
  }

  // Generate share data from backend
  static async generateShareData(type, contentId, customParams = {}) {
    try {
      const response = await request.post('/sharing/generate-link', {
        type,
        contentId,
        customParams
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to generate share data');
      }
    } catch (error) {
      console.error('Error generating share data:', error);

      // Fallback: generate local share data
      return this.generateFallbackShareData(type, contentId, customParams);
    }
  }

  // Fallback share data generation when backend is unavailable
  static generateFallbackShareData(type, contentId, customParams = {}) {
    const shareLinks = DeepLinkingService.generateShareableLink(type, contentId, customParams);

    const fallbackMessages = {
      reel: 'Check out this amazing reel on FoodTok!',
      profile: 'Check out this profile on FoodTok!',
      chefProfile: 'Check out this amazing chef on FoodTok!',
      chefMenu: 'Check out this delicious menu on FoodTok!',
      menu: 'Check out this menu on FoodTok!',
      dish: 'Check out this delicious dish on FoodTok!',
      live: 'Join me live on FoodTok!',
      story: 'Check out this story on FoodTok!'
    };

    return {
      shareLinks,
      shareText: customParams.shareText || fallbackMessages[type] || 'Check this out on FoodTok!',
      contentData: {
        title: customParams.title || 'FoodTok Content',
        description: customParams.description || ''
      }
    };
  }

  // Share specific content types
  static async shareReel(reelId, reelData = {}) {
    const customData = {
      shareText: reelData.title
        ? `Check out "${reelData.title}" by ${reelData.creator?.name || 'this creator'} on FoodTok! 🍽️`
        : 'Check out this amazing food reel on FoodTok! 🍽️',
      title: reelData.title,
      creator: reelData.creator?.name,
      hashtags: ['#FoodTok', '#Food', '#Cooking', '#Reel']
    };

    return this.shareContent('reel', reelId, customData);
  }

  static async shareProfile(profileId, profileData = {}) {
    const isChef = profileData.type === 'chef';
    const customData = {
      shareText: isChef
        ? strings.formatString(strings.shareChefText, profileData.name || 'this amazing chef')
        : strings.formatString(strings.shareProfileText, profileData.name || 'this profile'),
      title: profileData.name,
      type: profileData.type,
      hashtags: isChef ? ['#FoodTok', '#Chef', '#Cooking'] : ['#FoodTok', '#Profile']
    };

    const type = isChef ? 'chefProfile' : 'profile';
    return this.shareContent(type, profileId, customData);
  }

  static async shareChefMenu(chefId, chefData = {}) {
    const customData = {
      shareText: strings.formatString(strings.shareMenuText, chefData.name || 'this chef'),
      title: `${chefData.name}'s Menu`,
      chefName: chefData.name,
      hashtags: ['#FoodTok', '#Menu', '#Chef', '#Delivery', '#Order']
    };

    return this.shareContent('chefMenu', chefId, customData);
  }

  static async shareMenu(menuId, menuData = {}) {
    const customData = {
      shareText: `Check out "${menuData.name || 'this amazing menu'}" on FoodTok! 📋`,
      title: menuData.name,
      chefName: menuData.chef?.name,
      hashtags: ['#FoodTok', '#Menu', '#Food']
    };

    return this.shareContent('menu', menuId, customData);
  }

  static async shareDish(dishId, dishData = {}) {
    const customData = {
      shareText: `Check out "${dishData.name || 'this delicious dish'}" by ${dishData.chef?.name || 'this chef'} on FoodTok! 🍽️`,
      title: dishData.name,
      price: dishData.price,
      chefName: dishData.chef?.name,
      hashtags: ['#FoodTok', '#Food', '#Delicious', '#Order']
    };

    return this.shareContent('dish', dishId, customData);
  }

  static async shareLiveStream(liveId, liveData = {}) {
    const customData = {
      shareText: `🔴 ${liveData.streamer?.name || 'Someone'} is going live on FoodTok! Join now: "${liveData.title || 'Live Stream'}"`,
      title: liveData.title,
      streamerName: liveData.streamer?.name,
      hashtags: ['#FoodTok', '#Live', '#Cooking', '#LiveStream']
    };

    return this.shareContent('live', liveId, customData);
  }

  // Copy link to clipboard
  static async copyLinkToClipboard(type, contentId, customParams = {}) {
    try {
      const shareData = await this.generateShareData(type, contentId, customParams);
      const { Clipboard } = require('react-native');

      Clipboard.setString(shareData.shareLinks.universalLink);
      Alert.alert(strings.linkCopied, strings.linkCopiedMessage);

      return { success: true };
    } catch (error) {
      console.error('Copy link error:', error);
      Alert.alert(strings.error, strings.failedToCopyLink);
      return { success: false, error: error.message };
    }
  }

  // Share to specific platforms
  static async shareToInstagram(type, contentId, imageUrl = null) {
    try {
      const canOpen = await Linking.canOpenURL('instagram://app');

      if (!canOpen) {
        Alert.alert(strings.instagramNotFound, strings.installInstagram);
        return { success: false, error: 'Instagram not installed' };
      }

      if (imageUrl) {
        // Share image to Instagram Stories
        const instagramUrl = `instagram-stories://share?source_application=${Platform.OS === 'ios' ? 'your-ios-bundle-id' : 'your-android-package-name'}`;
        await Linking.openURL(instagramUrl);
      } else {
        // Open Instagram and let user share manually
        await Linking.openURL('instagram://app');
      }

      return { success: true };
    } catch (error) {
      console.error('Instagram sharing error:', error);
      return { success: false, error: error.message };
    }
  }

  static async shareToWhatsApp(type, contentId, customParams = {}) {
    try {
      const shareData = await this.generateShareData(type, contentId, customParams);
      const message = encodeURIComponent(`${shareData.shareText}\n\n${shareData.shareLinks.universalLink}`);
      const whatsappUrl = `whatsapp://send?text=${message}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return { success: true };
      } else {
        Alert.alert(strings.whatsappNotFound, strings.installWhatsApp);
        return { success: false, error: 'WhatsApp not installed' };
      }
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      return { success: false, error: error.message };
    }
  }

  static async shareToTwitter(type, contentId, customParams = {}) {
    try {
      const shareData = await this.generateShareData(type, contentId, customParams);
      const hashtags = shareData.hashtags ? shareData.hashtags.join(',').replace(/#/g, '') : 'FoodTok';
      const text = encodeURIComponent(shareData.shareText);
      const url = encodeURIComponent(shareData.shareLinks.universalLink);

      const twitterUrl = `twitter://post?message=${text}&url=${url}&hashtags=${hashtags}`;
      const webUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;

      const canOpen = await Linking.canOpenURL(twitterUrl);

      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        await Linking.openURL(webUrl);
      }

      return { success: true };
    } catch (error) {
      console.error('Twitter sharing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Track sharing analytics
  static trackSharing(type, contentId, platform = 'native') {
    // Implement your analytics tracking here


    // You can integrate with your analytics service here
    // Analytics.track('content_shared', {
    //   content_type: type,
    //   content_id: contentId,
    //   platform: platform
    // });
  }

  // Get platform-specific share options
  static getShareOptions(type, contentData = {}) {
    const baseOptions = [
      { key: 'native', title: 'More Options', icon: 'share' },
      { key: 'copy', title: 'Copy Link', icon: 'copy' },
    ];

    const socialOptions = [
      { key: 'whatsapp', title: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
      { key: 'twitter', title: 'Twitter', icon: 'twitter', color: '#1DA1F2' },
      { key: 'instagram', title: 'Instagram', icon: 'instagram', color: '#E4405F' },
    ];

    // Add type-specific options
    if (type === 'reel' || type === 'story') {
      socialOptions.unshift({ key: 'instagram-story', title: 'Instagram Story', icon: 'instagram', color: '#E4405F' });
    }

    return [...baseOptions, ...socialOptions];
  }

  // Handle share option selection
  static async handleShareOption(option, type, contentId, contentData = {}, customParams = {}) {
    switch (option.key) {
      case 'native':
        return this.shareContent(type, contentId, customParams);
      case 'copy':
        return this.copyLinkToClipboard(type, contentId, customParams);
      case 'whatsapp':
        return this.shareToWhatsApp(type, contentId, customParams);
      case 'twitter':
        return this.shareToTwitter(type, contentId, customParams);
      case 'instagram':
      case 'instagram-story':
        return this.shareToInstagram(type, contentId, contentData.imageUrl);
      default:
        console.warn('Unknown share option:', option.key);
        return { success: false, error: 'Unknown share option' };
    }
  }
}

export default SharingUtils; 